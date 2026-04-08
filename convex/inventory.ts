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
