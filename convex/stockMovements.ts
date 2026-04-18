import { query } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace } from './utils';

export const list = query({
  args: { workspaceId: v.id('workspaces'), inventoryItemId: v.optional(v.id('inventoryItems')) },
  handler: async (ctx, { workspaceId, inventoryItemId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const baseQuery = inventoryItemId
      ? ctx.db
          .query('stockMovements')
          .withIndex('by_workspace_inventory_item', (q) =>
            q.eq('workspaceId', workspaceId).eq('inventoryItemId', inventoryItemId)
          )
      : ctx.db.query('stockMovements').withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId));

    const movements = [];
    for await (const movement of baseQuery.order('desc')) {
      movements.push(movement);
    }

    // Enhance with item names and user names
    return Promise.all(
      movements.map(async (m) => {
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
