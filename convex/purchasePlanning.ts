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

    return Promise.all(
      recs.map(async (rec) => {
        const item = await ctx.db.get(rec.inventoryItemId);
        const supplier = rec.supplierId ? await ctx.db.get(rec.supplierId) : null;
        return { ...rec, item, supplier };
      })
    );
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
