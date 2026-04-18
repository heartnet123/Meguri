// Updated catalog fields in mutation validators
import { query, mutation, QueryCtx, MutationCtx } from './_generated/server';

import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { verifyWorkspace, checkRole } from './utils';

type RecipeIngredientInput = {
  inventoryItemId: Id<'inventoryItems'>;
  quantity: number;
  unit: string;
};

async function calculateRecipeBatchCost(
  ctx: QueryCtx | MutationCtx,
  ingredients: RecipeIngredientInput[]
) {
  let total = 0;
  for (const ingredient of ingredients) {
    const item = await ctx.db.get(ingredient.inventoryItemId);
    const costPerUnit = item?.costPerUnit ?? 0;
    total += ingredient.quantity * costPerUnit;
  }
  return total;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List all sellable recipes for a workspace.
 * Recipes are now the primary "Product" entity.
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
        const ingredientDocs = await ctx.db
          .query('recipeIngredients')
          .withIndex('by_recipe', (q) => q.eq('recipeId', recipe._id))
          .collect();

        const batchCost = await calculateRecipeBatchCost(ctx, ingredientDocs);
        const unitCost = recipe.yieldQty > 0 ? batchCost / recipe.yieldQty : 0;

        // Enrich ingredient list with item names
        const enrichedIngredients = await Promise.all(
          ingredientDocs.map(async (ing) => {
            const item = await ctx.db.get(ing.inventoryItemId);
            return {
              ...ing,
              inventoryItemName: item?.name ?? '(deleted)',
              inventoryItemUnit: item?.unit ?? ing.unit,
              inventoryItemCostPerUnit: item?.costPerUnit ?? 0,
              lineCost: Number((ing.quantity * (item?.costPerUnit ?? 0)).toFixed(2)),
            };
          })
        );

        return {
          ...recipe,
          ingredientCount: ingredientDocs.length,
          batchCost: Number(batchCost.toFixed(2)),
          unitCost: Number(unitCost.toFixed(2)),
          marginPct: recipe.price > 0 ? Math.round(((recipe.price - unitCost) / recipe.price) * 100) : 0,
          ingredients: enrichedIngredients,
        };
      })
    );
  },
});

/**
 * Get a single recipe with enriched ingredients.
 */
export const getById = query({
  args: { recipeId: v.id('recipes') },
  handler: async (ctx, { recipeId }) => {
    const recipe = await ctx.db.get(recipeId);
    if (!recipe) return null;

    await verifyWorkspace(ctx, recipe.workspaceId);

    const ingredients = await ctx.db
      .query('recipeIngredients')
      .withIndex('by_recipe', (q) => q.eq('recipeId', recipeId))
      .collect();

    const enrichedIngredients = await Promise.all(
      ingredients.map(async (ing) => {
        const item = await ctx.db.get(ing.inventoryItemId);
        const costPerUnit = item?.costPerUnit ?? 0;
        return {
          ...ing,
          inventoryItemName: item?.name ?? '(deleted)',
          inventoryItemUnit: item?.unit ?? ing.unit,
          inventoryItemCostPerUnit: costPerUnit,
          lineCost: Number((ing.quantity * costPerUnit).toFixed(2)),
        };
      })
    );

    const batchCost = enrichedIngredients.reduce((sum, i) => sum + i.lineCost, 0);
    const unitCost = recipe.yieldQty > 0 ? batchCost / recipe.yieldQty : 0;

    return {
      ...recipe,
      ingredients: enrichedIngredients,
      batchCost: Number(batchCost.toFixed(2)),
      unitCost: Number(unitCost.toFixed(2)),
      marginPct: recipe.price > 0 ? Math.round(((recipe.price - unitCost) / recipe.price) * 100) : 0,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new sellable recipe.
 */
export const add = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    name: v.string(),
    sku: v.string(),
    category: v.union(
      v.literal('finished_goods'),
      v.literal('bundles'),
      v.literal('raw_materials'),
    ),
    price: v.number(),
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
  handler: async (ctx, args) => {
    const user = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    const recipeId = await ctx.db.insert('recipes', {
      workspaceId: args.workspaceId,
      displayId: args.displayId,
      name: args.name,
      sku: args.sku,
      category: args.category,
      price: args.price,
      yieldQty: args.yieldQty,
      yieldUnit: args.yieldUnit,
      isActive: true,
      createdAt: Date.now(),
    });

    for (const ing of args.ingredients) {
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
 * Update an existing recipe and its catalog metadata.
 */
export const update = mutation({
  args: {
    recipeId: v.id('recipes'),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal('finished_goods'),
      v.literal('bundles'),
      v.literal('raw_materials'),
    )),
    price: v.optional(v.number()),
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
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error('Recipe not found');

    const user = await verifyWorkspace(ctx, recipe.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager']);

    const { recipeId, ingredients, name, sku, category, price, yieldQty, yieldUnit, isActive } = args;

    const fieldsToPatch: any = {};
    if (name !== undefined) fieldsToPatch.name = name;
    if (sku !== undefined) fieldsToPatch.sku = sku;
    if (category !== undefined) fieldsToPatch.category = category;
    if (price !== undefined) fieldsToPatch.price = price;
    if (yieldQty !== undefined) fieldsToPatch.yieldQty = yieldQty;
    if (yieldUnit !== undefined) fieldsToPatch.yieldUnit = yieldUnit;
    if (isActive !== undefined) fieldsToPatch.isActive = isActive;

    if (Object.keys(fieldsToPatch).length > 0) {
      await ctx.db.patch(recipeId, {
        ...fieldsToPatch,
        updatedAt: Date.now(),
      });
    }

    if (ingredients !== undefined) {
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
