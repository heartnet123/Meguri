import { query } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace } from './utils';
import { Id } from './_generated/dataModel';

export const summary = query({
  args: { workspaceId: v.id('workspaces'), startOfDayMs: v.number() },
  handler: async (ctx, { workspaceId, startOfDayMs }) => {
    await verifyWorkspace(ctx, workspaceId);

    const todayTrx = await ctx.db
      .query('salesTransactions')
      .withIndex('by_workspace_date', (q) => q.eq('workspaceId', workspaceId))
      .filter((q) => q.gte(q.field('createdAt'), startOfDayMs))
      .collect();

    const completed = todayTrx.filter((t) => t.status === 'completed');
    const todayRevenue = completed.reduce((s, t) => s + t.totalAmount, 0);

    const allItems = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const lowStock = allItems.filter((i) => i.currentStock < i.minStockLevel);
    const critical = lowStock.filter(
      (i) => i.currentStock <= 0 || i.currentStock < i.minStockLevel * 0.3
    );

    const openAlerts = await ctx.db
      .query('alerts')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'open')
      )
      .collect();

    const pendingRecs = await ctx.db
      .query('reorderRecommendations')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'pending')
      )
      .collect();

    return {
      todayRevenue,
      todayOrderCount: completed.length,
      lowStockCount: lowStock.length,
      criticalCount: critical.length,
      openAlertCount: openAlerts.length,
      pendingRecommendations: pendingRecs.length,
    };
  },
});

export const lowStockItems = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const items = await ctx.db
      .query('inventoryItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    return items
      .filter((i) => i.currentStock < i.minStockLevel)
      .map((i) => ({
        ...i,
        status:
          i.currentStock <= 0 || i.currentStock < i.minStockLevel * 0.3
            ? ('Critical' as const)
            : ('Warning' as const),
      }))
      .sort((a, b) => (a.status === 'Critical' ? -1 : 1) - (b.status === 'Critical' ? -1 : 1))
      .slice(0, 5);
  },
});

export const reorderRecommendations = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const recs = await ctx.db
      .query('reorderRecommendations')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'pending')
      )
      .order('desc')
      .collect();

    const top = recs
      .sort((a, b) => (a.urgency === 'high' ? -1 : 1) - (b.urgency === 'high' ? -1 : 1))
      .slice(0, 3);

    // Pre-fetch distinct items and suppliers to avoid N+1 queries
    const itemIds = Array.from(new Set(top.map((r) => r.inventoryItemId)));
    const supplierIds = Array.from(
      new Set(top.map((r) => r.supplierId).filter((id): id is Id<'suppliers'> => id !== undefined))
    );

    const [items, suppliers] = await Promise.all([
      Promise.all(itemIds.map((id) => ctx.db.get(id))),
      Promise.all(supplierIds.map((id) => ctx.db.get(id))),
    ]);

    const itemMap = new Map(items.flatMap((i) => (i ? [[i._id, i]] : [])));
    const supplierMap = new Map(suppliers.flatMap((s) => (s ? [[s._id, s]] : [])));

    return top.map((rec) => {
      const item = itemMap.get(rec.inventoryItemId);
      const supplier = rec.supplierId ? supplierMap.get(rec.supplierId) : null;
      return {
        ...rec,
        itemName: item?.name ?? 'Unknown Item',
        supplierName: supplier?.name ?? '—',
      };
    });
  },
});

export const anomalies = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    return ctx.db
      .query('alerts')
      .withIndex('by_workspace_status', (q) =>
        q.eq('workspaceId', workspaceId).eq('status', 'open')
      )
      .filter((q) => q.eq(q.field('type'), 'unusual_demand'))
      .order('desc')
      .collect();
  },
});
