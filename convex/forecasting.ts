import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const latestByItem = query({
  args: { workspaceId: v.id('workspaces'), periodDays: v.optional(v.number()) },
  handler: async (ctx, { workspaceId, periodDays }) => {
    const allItems = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const results = await Promise.all(
      allItems.map(async (item) => {
        const snapshots = await ctx.db
          .query('forecastSnapshots')
          .withIndex('by_item_date', (q) => q.eq('inventoryItemId', item._id))
          .order('desc')
          .collect();

        const snapshot = periodDays
          ? snapshots.find((s) => s.periodDays === periodDays)
          : snapshots[0];

        if (!snapshot) return null;
        return { itemName: item.name, itemUnit: item.unit, ...snapshot };
      })
    );

    return results.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );
  },
});

export const stats = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const allItems = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const latestSnapshots = await Promise.all(
      allItems.map((item) =>
        ctx.db
          .query('forecastSnapshots')
          .withIndex('by_item_date', (q) => q.eq('inventoryItemId', item._id))
          .order('desc')
          .first()
      )
    );

    const valid = latestSnapshots.filter((s): s is NonNullable<typeof s> => s !== null);
    const highConf = valid.filter((s) => s.confidence === 'high').length;
    const withWarnings = valid.filter((s) => !!s.warning).length;

    return {
      totalItems: allItems.length,
      itemsWithForecasts: valid.length,
      itemsHighConfidence: highConf,
      dataQualityIssues: withWarnings,
    };
  },
});

export const saveSnapshot = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    inventoryItemId: v.id('inventoryItems'),
    periodDays: v.number(),
    predictedQty: v.number(),
    unit: v.string(),
    trendPct: v.optional(v.number()),
    confidence: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    model: v.string(),
    warning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('forecastSnapshots', { ...args, generatedAt: Date.now() });
  },
});
