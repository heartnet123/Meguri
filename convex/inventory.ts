import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace, checkRole } from './utils';

function computeStatus(current: number, min: number): 'Critical' | 'Warning' | 'In Stock' {
  if (current <= 0 || current < min * 0.3) return 'Critical';
  if (current < min) return 'Warning';
  return 'In Stock';
}

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const items = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')
      .collect();
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

    const items = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();
    return items
      .filter((i) => i.currentStock < i.minStockLevel)
      .map((i) => ({ ...i, status: computeStatus(i.currentStock, i.minStockLevel) }))
      .sort((a, b) => {
        const order = { Critical: 0, Warning: 1, 'In Stock': 2 } as const;
        return order[a.status] - order[b.status];
      });
  },
});

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

    const now = Date.now();
    return ctx.db.insert('inventoryItems', { ...args, createdAt: now, updatedAt: now });
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
    if (!item) throw new Error('Item not found');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const updateStock = mutation({
  args: { id: v.id('inventoryItems'), currentStock: v.number() },
  handler: async (ctx, { id, currentStock }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error('Item not found');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

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
    if (!item) throw new Error('Item not found');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

    const newStock = item.currentStock + quantity;

    await ctx.db.patch(id, { currentStock: newStock, updatedAt: Date.now() });

    await ctx.db.insert('stockMovements', {
      workspaceId: item.workspaceId,
      inventoryItemId: id,
      type,
      quantity,
      note,
      performedBy: user._id,
      createdAt: Date.now(),
    });

    // Check for low stock to potentially create an alert
    const newStatus = computeStatus(newStock, item.minStockLevel);
    if (newStatus === 'Critical' || newStatus === 'Warning') {
      const existingAlerts = await ctx.db
        .query('alerts')
        .withIndex('by_workspace_status', (q) =>
          q.eq('workspaceId', item.workspaceId).eq('status', 'open')
        )
        .filter((q) => q.eq(q.field('relatedItemId'), id))
        .collect();

      if (existingAlerts.length === 0) {
        await ctx.db.insert('alerts', {
          workspaceId: item.workspaceId,
          displayId: `ALT-${Math.floor(Math.random() * 10000)}`,
          category: 'stock',
          type: 'low_stock',
          severity: newStatus === 'Critical' ? 'critical' : 'high',
          title: `Low Stock: ${item.name}`,
          description: `Stock level for ${item.name} has fallen to ${newStock} ${item.unit}. Minimum level is ${item.minStockLevel}.`,
          status: 'open',
          relatedItemId: id,
          relatedEntityType: 'inventory_item',
          relatedEntityId: id,
          createdAt: Date.now(),
        });
      }
    } else if (newStatus === 'In Stock') {
      // Resolve any existing low stock alerts for this item
      const existingAlerts = await ctx.db
        .query('alerts')
        .withIndex('by_workspace_status', (q) =>
          q.eq('workspaceId', item.workspaceId).eq('status', 'open')
        )
        .filter((q) => q.eq(q.field('relatedItemId'), id))
        .filter((q) => q.eq(q.field('type'), 'low_stock'))
        .collect();

      for (const alert of existingAlerts) {
        await ctx.db.patch(alert._id, {
          status: 'resolved',
          resolvedAt: Date.now(),
          resolvedBy: user._id,
          resolutionNote: 'Stock level recovered above the minimum threshold.',
        });
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id('inventoryItems') },
  handler: async (ctx, { id }) => {
    const item = await ctx.db.get(id);
    if (!item) throw new Error('Item not found');

    const user = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(user, ['owner', 'admin']);

    await ctx.db.delete(id);
  },
});
