import { query } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace } from './utils';

export const list = query({
  args: { workspaceId: v.id('workspaces'), inventoryItemId: v.optional(v.id('inventoryItems')) },
  handler: async (ctx, { workspaceId, inventoryItemId }) => {
    await verifyWorkspace(ctx, workspaceId);

    let q = ctx.db.query('stockMovements').withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId));

    const movements = await q.order('desc').collect();

    let filtered = movements;
    if (inventoryItemId) {
      filtered = movements.filter((m) => m.inventoryItemId === inventoryItemId);
    }

    // Enhance with item names and user names
    return Promise.all(
      filtered.map(async (m) => {
        const item = await ctx.db.get(m.inventoryItemId);
        const user = await ctx.db.get(m.performedBy);
        return {
          ...m,
          itemName: item?.name || 'Unknown Item',
          userName: user?.name || 'Unknown User',
        };
      })
    );
  },
});
