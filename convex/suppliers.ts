import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace, checkRole } from './utils';

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    return ctx.db
      .query('suppliers')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('asc')
      .collect();
  },
});

export const stats = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const all = await ctx.db
      .query('suppliers')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const total = all.length;
    const avgRating =
      total > 0
        ? Math.round((all.reduce((s, x) => s + x.rating, 0) / total) * 10) / 10
        : 0;

    const pending = await ctx.db
      .query('purchaseOrders')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'pending')
      )
      .collect();

    return { total, avgRating, pendingOrderCount: pending.length };
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    name: v.string(),
    category: v.string(),
    contactName: v.string(),
    email: v.string(),
    phone: v.string(),
    rating: v.number(),
    status: v.union(
      v.literal('active'),
      v.literal('needs_review'),
      v.literal('inactive')
    ),
    leadTimeMinDays: v.number(),
    leadTimeMaxDays: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    return ctx.db.insert('suppliers', { ...args, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('suppliers') },
  handler: async (ctx, { id }) => {
    const supplier = await ctx.db.get(id);
    if (!supplier) throw new Error('Supplier not found');

    const user = await verifyWorkspace(ctx, supplier.workspaceId);
    checkRole(user, ['owner', 'admin']);

    const existingOrders = await ctx.db
      .query('purchaseOrders')
      .withIndex('by_supplier', (q) => q.eq('supplierId', id))
      .first();

    if (existingOrders) {
      throw new Error('Cannot delete supplier with existing purchase orders. Consider marking them as inactive instead.');
    }

    await ctx.db.delete(id);
  },
});
