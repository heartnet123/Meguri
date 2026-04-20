import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { verifyWorkspace, checkRole } from './utils';

function calcMarginPct(salePrice: number, purchaseCost: number) {
  if (salePrice <= 0) return 0;
  return Math.round(((salePrice - purchaseCost) / salePrice) * 100);
}

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const items = await ctx.db
      .query('sellableItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')
      .collect();

    return items.map((item) => ({
      ...item,
      profit: Number((item.salePrice - item.purchaseCost).toFixed(2)),
      marginPct: calcMarginPct(item.salePrice, item.purchaseCost),
    }));
  },
});

export const summary = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const items = await ctx.db
      .query('sellableItems')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const activeItems = items.filter((item) => item.isActive).length;
    const totalValue = items.reduce((sum, item) => sum + item.salePrice * (item.currentStock ?? 0), 0);
    const avgMargin = items.length
      ? Math.round(items.reduce((sum, item) => sum + calcMarginPct(item.salePrice, item.purchaseCost), 0) / items.length)
      : 0;

    return { totalItems: items.length, activeItems, totalValue, avgMargin };
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    name: v.string(),
    sku: v.string(),
    purchaseCost: v.number(),
    salePrice: v.number(),
    trackStock: v.boolean(),
    currentStock: v.number(),
    minStockLevel: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership } = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(membership, ['owner', 'admin', 'manager']);

    if (args.salePrice < args.purchaseCost) {
      throw new ConvexError('Sale price must be greater than or equal to purchase cost.');
    }

    return await ctx.db.insert('sellableItems', {
      workspaceId: args.workspaceId,
      displayId: args.displayId,
      name: args.name,
      sku: args.sku,
      purchaseCost: args.purchaseCost,
      salePrice: args.salePrice,
      profit: args.salePrice - args.purchaseCost,
      marginPct: calcMarginPct(args.salePrice, args.purchaseCost),
      trackStock: args.trackStock,
      currentStock: args.currentStock,
      minStockLevel: args.minStockLevel,
      isActive: true,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    sellableItemId: v.id('sellableItems'),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    purchaseCost: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    trackStock: v.optional(v.boolean()),
    currentStock: v.optional(v.number()),
    minStockLevel: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.sellableItemId);
    if (!item) throw new ConvexError('Sellable item not found');

    const { membership } = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(membership, ['owner', 'admin', 'manager']);

    const salePrice = args.salePrice ?? item.salePrice;
    const purchaseCost = args.purchaseCost ?? item.purchaseCost;

    await ctx.db.patch(args.sellableItemId, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.sku !== undefined ? { sku: args.sku } : {}),
      ...(args.purchaseCost !== undefined ? { purchaseCost: args.purchaseCost } : {}),
      ...(args.salePrice !== undefined ? { salePrice: args.salePrice } : {}),
      ...(args.trackStock !== undefined ? { trackStock: args.trackStock } : {}),
      ...(args.currentStock !== undefined ? { currentStock: args.currentStock } : {}),
      ...(args.minStockLevel !== undefined ? { minStockLevel: args.minStockLevel } : {}),
      ...(args.isActive !== undefined ? { isActive: args.isActive } : {}),
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      profit: salePrice - purchaseCost,
      marginPct: calcMarginPct(salePrice, purchaseCost),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { sellableItemId: v.id('sellableItems') },
  handler: async (ctx, { sellableItemId }) => {
    const item = await ctx.db.get(sellableItemId);
    if (!item) throw new ConvexError('Sellable item not found');

    const { membership } = await verifyWorkspace(ctx, item.workspaceId);
    checkRole(membership, ['owner', 'admin']);

    await ctx.db.delete(sellableItemId);
  },
});
