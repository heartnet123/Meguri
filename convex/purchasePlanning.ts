import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const recommendations = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const recs = await ctx.db
      .query('reorderRecommendations')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'pending')
      )
      .order('desc')
      .collect();

    const itemIds = [...new Set(recs.map((r) => r.inventoryItemId))];
    const supplierIds = [
      ...new Set(recs.map((r) => r.supplierId).filter((id): id is NonNullable<typeof id> => !!id)),
    ];

    const [items, suppliers] = await Promise.all([
      Promise.all(itemIds.map((id) => ctx.db.get(id))),
      Promise.all(supplierIds.map((id) => ctx.db.get(id))),
    ]);

    const itemMap = new Map(itemIds.map((id, i) => [id, items[i]]));
    const supplierMap = new Map(supplierIds.map((id, i) => [id, suppliers[i]]));

    return recs.map((rec) => ({
      ...rec,
      item: itemMap.get(rec.inventoryItemId),
      supplier: rec.supplierId ? supplierMap.get(rec.supplierId) : null,
    }));
  },
});

export const accept = mutation({
  args: { id: v.id('reorderRecommendations') },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: 'accepted' });
  },
});

export const dismiss = mutation({
  args: { id: v.id('reorderRecommendations') },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: 'dismissed' });
  },
});

export const draftOrders = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    return ctx.db
      .query('purchaseOrders')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'draft')
      )
      .collect();
  },
});
