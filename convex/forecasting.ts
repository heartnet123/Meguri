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

export const generate = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    // 1. Fetch all inventory items
    const items = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Delete previous pending recommendations to avoid duplicates
    const pendingRecs = await ctx.db
      .query('reorderRecommendations')
      .withIndex('by_workspace_status', (q) => q.eq('workspaceId', workspaceId).eq('status', 'pending'))
      .collect();
    for (const rec of pendingRecs) {
      await ctx.db.delete(rec._id);
    }

    for (const item of items) {
      // 2. Calculate daily consumption based on stockMovements
      const movements = await ctx.db
        .query('stockMovements')
        .withIndex('by_item', (q) => q.eq('inventoryItemId', item._id))
        .collect();
      
      const recentOutflow = movements.filter(m => m.createdAt >= thirtyDaysAgo && (m.type === 'sale' || m.type === 'wastage' || m.quantity < 0));
      const totalOutflow = recentOutflow.reduce((acc, m) => acc + Math.abs(m.quantity), 0);
      
      const dailyRunRate = totalOutflow / 30;
      
      // Confidence logic
      const confidence = totalOutflow > 10 ? 'high' : totalOutflow > 0 ? 'medium' : 'low';
      const warning = totalOutflow === 0 ? 'Insufficient data' : undefined;

      // 3. Generate snapshots
      for (const days of [7, 14, 30]) {
        const predictedQty = dailyRunRate * days;
        await ctx.db.insert('forecastSnapshots', {
          workspaceId,
          inventoryItemId: item._id,
          periodDays: days,
          predictedQty: Math.round(predictedQty * 10) / 10,
          unit: item.unit,
          confidence,
          model: 'Moving Average',
          warning,
          generatedAt: now,
        });
      }

      // 4. Reorder Recommendation Logic
      let leadTimeDays = 7; // default
      if (item.supplierId) {
        const supplier = await ctx.db.get(item.supplierId);
        if (supplier) {
          leadTimeDays = supplier.leadTimeMaxDays || 7;
        }
      }
      
      const leadTimeDemand = dailyRunRate * leadTimeDays;
      if (item.currentStock - leadTimeDemand <= item.minStockLevel && totalOutflow > 0) {
        // Suggest reorder
        const recommendedQty = Math.max(item.minStockLevel - (item.currentStock - leadTimeDemand) + (dailyRunRate * 14), 1);
        
        await ctx.db.insert('reorderRecommendations', {
          workspaceId,
          inventoryItemId: item._id,
          supplierId: item.supplierId,
          recommendedQty: Math.ceil(recommendedQty),
          urgency: item.currentStock <= item.minStockLevel ? 'high' : 'medium',
          reason: `Stock will drop below min level (${item.minStockLevel}) in the next ${leadTimeDays} days due to lead time.`,
          status: 'pending',
          generatedAt: now,
        });
      }
    }
  },
});
