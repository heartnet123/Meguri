import { query, mutation, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { verifyWorkspace, checkRole } from './utils';
import { ConvexError } from 'convex/values';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeStatus(current: number, min: number): 'Critical' | 'Warning' | 'In Stock' {
  if (current <= 0 || current < min * 0.3) return 'Critical';
  if (current < min) return 'Warning';
  return 'In Stock';
}

/**
 * Ensure a low-stock alert exists (open) for the item. Idempotent.
 */
async function ensureLowStockAlert(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  itemId: Id<'inventoryItems'>,
  itemName: string,
  newStock: number,
  unit: string,
  minLevel: number,
  status: 'Critical' | 'Warning',
) {
  const existing = await ctx.db
    .query('alerts')
    .withIndex('by_workspace_status_related_item_type', (q) =>
      q
        .eq('workspaceId', workspaceId)
        .eq('status', 'open')
        .eq('relatedItemId', itemId)
        .eq('type', 'low_stock')
    )
    .first();
  if (!existing) {
    await ctx.db.insert('alerts', {
      workspaceId,
      displayId: `ALT-${Math.floor(Math.random() * 10000)}`,
      category: 'stock',
      type: 'low_stock',
      severity: status === 'Critical' ? 'critical' : 'high',
      title: `Low Stock: ${itemName}`,
      description: `Stock for ${itemName} is ${newStock} ${unit}. Minimum level is ${minLevel}.`,
      status: 'open',
      relatedItemId: itemId,
      relatedEntityType: 'inventory_item',
      relatedEntityId: itemId,
      createdAt: Date.now(),
    });
  }
}

/**
 * Auto-resolve open low-stock alerts when stock recovers.
 */
async function resolveLowStockAlerts(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  itemId: Id<'inventoryItems'>,
  userId: Id<'users'>,
) {
  for await (const alert of ctx.db
    .query('alerts')
    .withIndex('by_workspace_status_related_item_type', (q) =>
      q
        .eq('workspaceId', workspaceId)
        .eq('status', 'open')
        .eq('relatedItemId', itemId)
        .eq('type', 'low_stock')
    )
  ) {
    await ctx.db.patch(alert._id, {
      status: 'resolved',
      resolvedAt: Date.now(),
      resolvedBy: userId,
      resolutionNote: 'Stock level recovered above the minimum threshold.',
    });
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const list = query({
  args: { workspaceId: v.id('workspaces'), includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, { workspaceId, includeArchived }) => {
    await verifyWorkspace(ctx, workspaceId);

    const items = [];
    for await (const item of ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')) {
      if (includeArchived || !item.isArchived) {
        items.push(item);
      }
    }

    return items.map((item) => ({
        ...item,
        status: computeStatus(item.currentStock, item.minStockLevel),
      }));
  },
});

export const lowStock = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const items = [];
    for await (const item of ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))) {
      if (!item.isArchived && item.currentStock < item.minStockLevel) {
        items.push({ ...item, status: computeStatus(item.currentStock, item.minStockLevel) });
      }
    }

    return items
      .sort((a, b) => {
        const order = { Critical: 0, Warning: 1, 'In Stock': 2 } as const;
        return order[a.status] - order[b.status];
      });
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const add = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    unit: v.string(),
    currentStock: v.number(),
    minStockLevel: v.number(),
    supplierId: v.optional(v.id('suppliers')),
    costPerUnit: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    // ── Invariant: non-negative initial stock ──
    if (args.currentStock < 0) {
      throw new ConvexError('Initial stock cannot be negative.');
    }
    if (args.minStockLevel < 0) {
      throw new ConvexError('Minimum stock level cannot be negative.');
    }

    // ── Invariant: duplicate SKU guard ──
    const existing = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace_sku', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('sku', args.sku),
      )
      .first();
    if (existing) {
      throw new ConvexError(`SKU "${args.sku}" already exists in this workspace.`);
    }

    const now = Date.now();
    const itemId = await ctx.db.insert('inventoryItems', { ...args, isArchived: false, createdAt: now, updatedAt: now });

    // ── Audit: write initial_stock movement ──
    if (args.currentStock > 0) {
      await ctx.db.insert('stockMovements', {
        workspaceId: args.workspaceId,
        inventoryItemId: itemId,
        type: 'initial_stock',
        quantity: args.currentStock,
        note: 'Initial stock recorded on item creation.',
        performedBy: user._id,
        createdAt: now,
      });
    }

    return itemId;
  },
});

export const update = mutation({
  args: {
    id: v.id('inventoryItems'),
    sku: v.optional(v.string()),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.optional(v.string()),
    minStockLevel: v.optional(v.number()),
    supplierId: v.optional(v.id('suppliers')),
    costPerUnit: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const item = await ctx.db.get(id);
    if (!item) throw new ConvexError('Item not found.');
    if (item.isArchived) throw new ConvexError('Cannot edit an archived item.');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    // ── Invariant: non-negative min level ──
    if (updates.minStockLevel !== undefined && updates.minStockLevel < 0) {
      throw new ConvexError('Minimum stock level cannot be negative.');
    }

    // ── Invariant: duplicate SKU guard on rename ──
    if (updates.sku && updates.sku !== item.sku) {
      const collision = await ctx.db
        .query('inventoryItems')
        .withIndex('by_workspace_sku', (q) =>
          q.eq('workspaceId', item.workspaceId).eq('sku', updates.sku as string),
        )
        .first();
      if (collision) {
        throw new ConvexError(`SKU "${updates.sku}" already exists in this workspace.`);
      }
    }

    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

/**
 * updateStock is a raw bypass that has been made safe by:
 *  - blocking negative stock values
 *  - requiring a caller to exist in the workspace
 *
 * Prefer adjustStock for all operational paths since it also writes an audit record.
 */
export const updateStock = mutation({
  args: { id: v.id('inventoryItems'), currentStock: v.number() },
  handler: async (ctx, { id, currentStock }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new ConvexError('Item not found.');
    if (item.isArchived) throw new ConvexError('Cannot update stock for an archived item.');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    // ── Invariant: no negative stock ──
    if (currentStock < 0) {
      throw new ConvexError('Stock cannot be set to a negative value.');
    }

    await ctx.db.patch(id, { currentStock, updatedAt: Date.now() });
  },
});

export const adjustStock = mutation({
  args: {
    id: v.id('inventoryItems'),
    type: v.union(v.literal('adjustment'), v.literal('wastage')),
    quantity: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { id, type, quantity, note }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new ConvexError('Item not found.');
    if (item.isArchived) throw new ConvexError('Cannot adjust stock for an archived item.');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

    // ── Invariant: quantity must be non-zero ──
    if (quantity === 0) {
      throw new ConvexError('Adjustment quantity cannot be zero.');
    }

    const newStock = item.currentStock + quantity;

    // ── Invariant: no negative stock ──
    if (newStock < 0) {
      throw new ConvexError(
        `Adjustment would result in negative stock (${newStock} ${item.unit}). ` +
          `Current stock is ${item.currentStock} ${item.unit}.`,
      );
    }

    const now = Date.now();
    await ctx.db.patch(id, { currentStock: newStock, updatedAt: now });

    // ── Audit: write movement record ──
    await ctx.db.insert('stockMovements', {
      workspaceId: item.workspaceId,
      inventoryItemId: id,
      type,
      quantity,
      note,
      performedBy: user._id,
      createdAt: now,
    });

    // ── Alert management ──
    const newStatus = computeStatus(newStock, item.minStockLevel);
    if (newStatus === 'Critical' || newStatus === 'Warning') {
      await ensureLowStockAlert(ctx, item.workspaceId, id, item.name, newStock, item.unit, item.minStockLevel, newStatus);
    } else {
      await resolveLowStockAlerts(ctx, item.workspaceId, id, user._id);
    }
  },
});

/**
 * Soft-archive an inventory item instead of hard-deleting it.
 * The item remains in the database and its movement history is preserved.
 * Archived items are hidden from all operational views by default.
 */
export const archive = mutation({
  args: { id: v.id('inventoryItems'), note: v.optional(v.string()) },
  handler: async (ctx, { id, note }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new ConvexError('Item not found.');
    if (item.isArchived) throw new ConvexError('Item is already archived.');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin']);

    const now = Date.now();
    await ctx.db.patch(id, { isArchived: true, updatedAt: now });

    // ── Audit: write archive movement ──
    await ctx.db.insert('stockMovements', {
      workspaceId: item.workspaceId,
      inventoryItemId: id,
      type: 'archive',
      quantity: 0,
      note: note ?? 'Item archived.',
      performedBy: user._id,
      createdAt: now,
    });

    // Resolve any open low-stock alerts for this item
    await resolveLowStockAlerts(ctx, item.workspaceId, id, user._id);
  },
});

/**
 * @deprecated Use archive() instead. Kept for backwards compatibility.
 * Will throw if the item has any stock movements (use archive instead).
 */
export const remove = mutation({
  args: { id: v.id('inventoryItems') },
  handler: async (ctx, { id }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new ConvexError('Item not found.');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin']);

    // Block hard-delete if any movement records exist — use archive() instead
    const movementCount = await ctx.db
      .query('stockMovements')
      .withIndex('by_item', (q) => q.eq('inventoryItemId', id))
      .first();
    if (movementCount) {
      throw new ConvexError(
        'This item has movement history and cannot be hard-deleted. Use Archive instead to preserve the audit trail.',
      );
    }

    await ctx.db.delete(id);
  },
});
