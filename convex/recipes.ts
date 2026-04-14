import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { verifyWorkspace, checkRole } from './utils';

/**
 * Get the active recipe and its ingredients for a given product.
 */
export const getByProduct = query({
  args: { productId: v.id('products') },
  handler: async (ctx, { productId }) => {
    const product = await ctx.db.get(productId);
    if (!product) return null;

    await verifyWorkspace(ctx, product.workspaceId);

    const recipe = await ctx.db
      .query('recipes')
      .withIndex('by_product', (q) => q.eq('productId', productId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .first();

    if (!recipe) return null;

    const ingredients = await ctx.db
      .query('recipeIngredients')
      .withIndex('by_recipe', (q) => q.eq('recipeId', recipe._id))
      .collect();

    // Enrich with inventory item details
    const enrichedIngredients = await Promise.all(
      ingredients.map(async (ing) => {
        const item = await ctx.db.get(ing.inventoryItemId);
        return {
          ...ing,
          inventoryItemName: item?.name ?? '(deleted)',
          inventoryItemUnit: item?.unit ?? ing.unit,
        };
      })
    );

    return { ...recipe, ingredients: enrichedIngredients };
  },
});

/**
 * List all recipes for a workspace.
 */
export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')
      .collect();

    return Promise.all(
      recipes.map(async (recipe) => {
        const product = await ctx.db.get(recipe.productId);
        const ingredientCount = await ctx.db
          .query('recipeIngredients')
          .withIndex('by_recipe', (q) => q.eq('recipeId', recipe._id))
          .collect();
        return {
          ...recipe,
          productName: product?.name ?? '(deleted)',
          ingredientCount: ingredientCount.length,
        };
      })
    );
  },
});

/**
 * Create a new recipe for a product with its ingredients.
 */
export const add = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    productId: v.id('products'),
    name: v.string(),
    yieldQty: v.number(),
    yieldUnit: v.string(),
    ingredients: v.array(
      v.object({
        inventoryItemId: v.id('inventoryItems'),
        quantity: v.number(),
        unit: v.string(),
      })
    ),
  },
  handler: async (ctx, { workspaceId, productId, name, yieldQty, yieldUnit, ingredients }) => {
    const user = await verifyWorkspace(ctx, workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    // Deactivate any existing active recipes for this product
    const existingRecipes = await ctx.db
      .query('recipes')
      .withIndex('by_product', (q) => q.eq('productId', productId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    for (const r of existingRecipes) {
      await ctx.db.patch(r._id, { isActive: false });
    }

    const recipeId = await ctx.db.insert('recipes', {
      workspaceId,
      productId,
      name,
      yieldQty,
      yieldUnit,
      isActive: true,
      createdAt: Date.now(),
    });

    for (const ing of ingredients) {
      await ctx.db.insert('recipeIngredients', {
        recipeId,
        inventoryItemId: ing.inventoryItemId,
        quantity: ing.quantity,
        unit: ing.unit,
      });
    }

    return recipeId;
  },
});

/**
 * Update an existing recipe and replace all its ingredients.
 */
export const update = mutation({
  args: {
    recipeId: v.id('recipes'),
    name: v.optional(v.string()),
    yieldQty: v.optional(v.number()),
    yieldUnit: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    ingredients: v.optional(
      v.array(
        v.object({
          inventoryItemId: v.id('inventoryItems'),
          quantity: v.number(),
          unit: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, { recipeId, name, yieldQty, yieldUnit, isActive, ingredients }) => {
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) throw new Error('Recipe not found');

    const user = await verifyWorkspace(ctx, recipe.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (yieldQty !== undefined) updates.yieldQty = yieldQty;
    if (yieldUnit !== undefined) updates.yieldUnit = yieldUnit;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(recipeId, updates);
    }

    if (ingredients !== undefined) {
      // Delete existing ingredients and replace with new ones
      const oldIngredients = await ctx.db
        .query('recipeIngredients')
        .withIndex('by_recipe', (q) => q.eq('recipeId', recipeId))
        .collect();

      for (const old of oldIngredients) {
        await ctx.db.delete(old._id);
      }

      for (const ing of ingredients) {
        await ctx.db.insert('recipeIngredients', {
          recipeId,
          inventoryItemId: ing.inventoryItemId,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      }
    }
  },
});

/**
 * Delete a recipe and all its ingredients.
 */
export const remove = mutation({
  args: { recipeId: v.id('recipes') },
  handler: async (ctx, { recipeId }) => {
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) throw new Error('Recipe not found');

    const user = await verifyWorkspace(ctx, recipe.workspaceId);
    checkRole(user, ['owner', 'admin']);

    const ingredients = await ctx.db
      .query('recipeIngredients')
      .withIndex('by_recipe', (q) => q.eq('recipeId', recipeId))
      .collect();

    for (const ing of ingredients) {
      await ctx.db.delete(ing._id);
    }

    await ctx.db.delete(recipeId);
  },
});
