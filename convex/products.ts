import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace, checkRole } from './utils';

function computeStatus(stock: number): 'In Stock' | 'Low Stock' | 'Critical' {
  if (stock <= 0) return 'Critical';
  if (stock < 20) return 'Low Stock';
  return 'In Stock';
}

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const items = await ctx.db
      .query('products')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();
    return items.map((p) => ({
      ...p,
      status: computeStatus(p.currentStock),
      marginPct: p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0,
    }));
  },
});

export const stats = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const products = await ctx.db
      .query('products')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    let activeRecipes = 0;
    for (const p of products) {
      const rs = await ctx.db
        .query('recipes')
        .withIndex('by_product', (q) => q.eq('productId', p._id))
        .filter((q) => q.eq(q.field('isActive'), true))
        .collect();
      activeRecipes += rs.length;
    }

    return { total: products.length, activeRecipes };
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    name: v.string(),
    sku: v.string(),
    category: v.union(
      v.literal('finished_goods'),
      v.literal('bundles'),
      v.literal('raw_materials')
    ),
    price: v.number(),
    cost: v.number(),
    currentStock: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    const now = Date.now();
    return ctx.db.insert('products', { ...args, createdAt: now, updatedAt: now });
  },
});

export const remove = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error('Product not found');

    const user = await verifyWorkspace(ctx, product.workspaceId);
    checkRole(user, ['owner', 'admin']);

    await ctx.db.delete(id);
  },
});
