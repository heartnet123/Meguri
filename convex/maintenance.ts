import { mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * CAUTION: This will delete all sales and sale items.
 * Used during the Recipe-Centric Refactor to clear stale product-based data
 * that violates the new schema.
 */
export const clearStaleSales = internalMutation({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query('salesTransactions').collect();
    for (const t of transactions) {
      await ctx.db.delete(t._id);
    }
    
    const recipes = await ctx.db.query('recipes').collect();
    for (const r of recipes) {
      await ctx.db.delete(r._id);
    }
    
    // Also clear recipe ingredients if they still exist for deleted recipes
    const ingredients = await ctx.db.query('recipeIngredients').collect();
    for (const ing of ingredients) {
      await ctx.db.delete(ing._id);
    }
  },
});
