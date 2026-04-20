import { query, mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { verifyWorkspace, checkRole } from './utils';

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    await verifyWorkspace(ctx, workspaceId);

    return ctx.db
      .query('salesTransactions')
      .withIndex('by_workspace_date', (q) => q.eq('workspaceId', workspaceId))
      .order('desc')
      .collect();
  },
});

export const todayStats = query({
  args: { workspaceId: v.id('workspaces'), startOfDayMs: v.optional(v.number()) },
  handler: async (ctx, { workspaceId, startOfDayMs }) => {
    await verifyWorkspace(ctx, workspaceId);

    const startMs = startOfDayMs ?? (() => {
      const now = new Date();
      return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    })();

    const all = await ctx.db
      .query('salesTransactions')
      .withIndex('by_workspace_date', (q) => q.eq('workspaceId', workspaceId))
      .filter((q) => q.gte(q.field('createdAt'), startMs))
      .collect();

    const completed = all.filter((t) => t.status === 'completed');
    const revenue = completed.reduce((s, t) => s + t.totalAmount, 0);
    const cost = completed.reduce((s, t) => s + (t.totalCost ?? 0), 0);
    const orderCount = completed.length;
    const avgOrder = orderCount > 0 ? revenue / orderCount : 0;
    const margin = revenue - cost;
    const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;

    return { revenue, cost, margin, marginPct, orderCount, avgOrder };
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    customer: v.string(),
    itemCount: v.number(),
    totalAmount: v.number(),
    paymentMethod: v.union(
      v.literal('cash'),
      v.literal('credit_card'),
      v.literal('mobile_pay'),
      v.literal('invoice'),
    ),
    status: v.union(
      v.literal('completed'),
      v.literal('pending'),
      v.literal('refunded'),
      v.literal('cancelled'),
    ),
    items: v.optional(v.array(
      v.union(
        v.object({
          kind: v.literal('recipe'),
          recipeId: v.id('recipes'),
          quantity: v.number(),
          unitPrice: v.number(),
        }),
        v.object({
          kind: v.literal('sellableItem'),
          sellableItemId: v.id('sellableItems'),
          quantity: v.number(),
          unitPrice: v.number(),
        }),
      ),
    )),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(membership, ['owner', 'admin', 'manager', 'staff']);

    // ── 1. Validate item-level fields ──
    if (args.items && args.items.length > 0) {
      for (const item of args.items) {
        if (item.quantity <= 0) {
          throw new ConvexError('Invalid quantity. Must be > 0.');
        }
        if (item.kind === 'recipe') {
          const recipe = await ctx.db.get(item.recipeId);
          if (!recipe) throw new ConvexError(`Recipe/Product not found: ${item.recipeId}`);
        } else {
          const sellableItem = await ctx.db.get(item.sellableItemId);
          if (!sellableItem) throw new ConvexError(`Sellable item not found: ${item.sellableItemId}`);
        }
      }
    }

    // ── 2. For completed sales only — pre-compute and validate deductions ──
    // Maps: inventoryItemId → required quantity
    const inventoryDeductions = new Map<string, number>();
    const inventoryItemCache = new Map<string, any>();
    const sellableItemCache = new Map<string, any>();

    if (args.status === 'completed' && args.items && args.items.length > 0) {
      for (const item of args.items) {
        if (item.kind === 'recipe') {
          const recipe = (await ctx.db.get(item.recipeId))!;

          if (recipe.yieldQty <= 0) {
            throw new ConvexError(
              `Recipe for "${recipe.name}" has invalid yield (${recipe.yieldQty}). Yield must be > 0.`,
            );
          }

          const ingredients = await ctx.db
            .query('recipeIngredients')
            .withIndex('by_recipe', (q) => q.eq('recipeId', recipe._id))
            .collect();

          for (const ingredient of ingredients) {
            if (ingredient.quantity <= 0) continue;

            const requiredQty = (item.quantity / recipe.yieldQty) * ingredient.quantity;
            const current = inventoryDeductions.get(ingredient.inventoryItemId) ?? 0;
            inventoryDeductions.set(ingredient.inventoryItemId, current + requiredQty);
          }
        } else {
          const sellableItem = (await ctx.db.get(item.sellableItemId))!;
          sellableItemCache.set(item.sellableItemId, sellableItem);

          if (sellableItem.trackStock) {
            if ((sellableItem as any).currentStock < item.quantity) {
              throw new ConvexError(
                `Insufficient stock for "${sellableItem.name}". Required: ${item.quantity}, Available: ${(sellableItem as any).currentStock}.`,
              );
            }

            if ((sellableItem as any).inventoryItemId) {
              const current = inventoryDeductions.get((sellableItem as any).inventoryItemId) ?? 0;
              inventoryDeductions.set((sellableItem as any).inventoryItemId, current + item.quantity);
            }
          }
        }
      }

      for (const [inventoryItemId, requiredQty] of inventoryDeductions.entries()) {
        const invItem = await ctx.db.get(inventoryItemId as any);
        if (!invItem) throw new ConvexError(`Inventory item not found: ${inventoryItemId}`);
        if ((invItem as any).isArchived) {
          throw new ConvexError(`Inventory item "${(invItem as any).name}" is archived and cannot be used.`);
        }
        inventoryItemCache.set(inventoryItemId, invItem);

        if ((invItem as any).currentStock < requiredQty) {
          throw new ConvexError(
            `Insufficient stock for "${(invItem as any).name}". ` +
              `Required: ${requiredQty.toFixed(2)}, Available: ${(invItem as any).currentStock}.`,
          );
        }
      }
    }

    // ── 4. Compute estimated COGS from BOM ingredients / sellable item cost ──
    let totalCost = 0;
    if (args.items && args.items.length > 0) {
      for (const item of args.items) {
        if (item.kind === 'recipe') {
          const recipe = (await ctx.db.get(item.recipeId))!;
          const ingredients = await ctx.db
            .query('recipeIngredients')
            .withIndex('by_recipe', (q) => q.eq('recipeId', recipe._id))
            .collect();

          let itemUnitCost = 0;
          for (const ingredient of ingredients) {
            const invItem = inventoryItemCache.get(ingredient.inventoryItemId as string)
              ?? await ctx.db.get(ingredient.inventoryItemId);
            const costPerUnit = (invItem as any)?.costPerUnit ?? 0;
            const singleQty = recipe.yieldQty > 0 ? ingredient.quantity / recipe.yieldQty : 0;
            itemUnitCost += singleQty * costPerUnit;
          }
          totalCost += itemUnitCost * item.quantity;
        } else {
          const sellableItem = sellableItemCache.get(item.sellableItemId as string)
            ?? await ctx.db.get(item.sellableItemId);
          totalCost += ((sellableItem as any)?.purchaseCost ?? 0) * item.quantity;
        }
      }
    }

    // ── 5. Write transaction and lines — all checks passed ──
    const now = Date.now();
    
    const transactionId = await ctx.db.insert('salesTransactions', {
      workspaceId: args.workspaceId,
      displayId: args.displayId,
      customer: args.customer,
      itemCount: args.itemCount,
      totalAmount: args.totalAmount,
      totalCost: Math.round(totalCost * 100) / 100,
      paymentMethod: args.paymentMethod,
      status: args.status,
      createdAt: now,
    });

    if (args.items && args.items.length > 0) {
      for (const item of args.items) {
        if (item.kind === 'recipe') {
          await ctx.db.insert('saleItems', {
            transactionId,
            recipeId: item.recipeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          });
        } else {
          await ctx.db.insert('saleItems', {
            transactionId,
            recipeId: undefined as any,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          });
        }
      }

      if (args.status === 'completed') {
        for (const [inventoryItemId, deductionQty] of inventoryDeductions.entries()) {
          const invItem = inventoryItemCache.get(inventoryItemId) as any;
          const newStock = invItem.currentStock - deductionQty;

          await ctx.db.patch(invItem._id, { currentStock: newStock, updatedAt: now });

          await ctx.db.insert('stockMovements', {
            workspaceId: args.workspaceId,
            inventoryItemId: invItem._id,
            type: 'sale',
            quantity: -deductionQty,
            referenceId: args.displayId,
            note: `Deducted by sale ${args.displayId}`,
            performedBy: user._id,
            createdAt: now,
          });
        }

        for (const item of args.items) {
          if (item.kind !== 'sellableItem') continue;
          const sellableItem = sellableItemCache.get(item.sellableItemId as string) as any;
          if (!sellableItem.trackStock) continue;

          const newStock = (sellableItem.currentStock ?? 0) - item.quantity;
          await ctx.db.patch(sellableItem._id, { currentStock: newStock, updatedAt: now });

          if (sellableItem.inventoryItemId) {
            await ctx.db.insert('stockMovements', {
              workspaceId: args.workspaceId,
              inventoryItemId: sellableItem.inventoryItemId,
              type: 'sale',
              quantity: -item.quantity,
              referenceId: args.displayId,
              note: `Sold sellable item ${sellableItem.displayId}`,
              performedBy: user._id,
              createdAt: now,
            });
          }
        }
      }
    }

    return transactionId;
  },
});

export const getImpactPreview = query({
  args: {
    workspaceId: v.id('workspaces'),
    items: v.array(
      v.object({
        recipeId: v.id('recipes'),
        quantity: v.number(),
      }),
    ),
  },
  handler: async (ctx, { workspaceId, items }) => {
    await verifyWorkspace(ctx, workspaceId);

    if (items.length === 0) {
      return { ingredientImpacts: [], totals: { revenue: 0, cost: 0, margin: 0, marginPct: 0 } };
    }

    const inventoryDeductions = new Map<string, number>();
    let totalRevenue = 0;
    let totalEstimatedCost = 0;

    for (const item of items) {
      const recipe = await ctx.db.get(item.recipeId);
      if (!recipe) continue;

      totalRevenue += recipe.price * item.quantity;

      const ingredients = await ctx.db
        .query('recipeIngredients')
        .withIndex('by_recipe', (q) => q.eq('recipeId', recipe._id))
        .collect();

      let itemUnitCost = 0;
      for (const ingredient of ingredients) {
        const invItem = await ctx.db.get(ingredient.inventoryItemId);
        const costPerUnit = (invItem as any)?.costPerUnit ?? 0;
        
        const requiredQty = recipe.yieldQty > 0
          ? (item.quantity / recipe.yieldQty) * ingredient.quantity
          : 0;
        
        const current = inventoryDeductions.get(ingredient.inventoryItemId) ?? 0;
        inventoryDeductions.set(ingredient.inventoryItemId, current + requiredQty);
        
        // Single unit cost contribution
        const singleQty = recipe.yieldQty > 0 ? ingredient.quantity / recipe.yieldQty : 0;
        itemUnitCost += singleQty * costPerUnit;
      }
      
      totalEstimatedCost += itemUnitCost * item.quantity;
    }

    const ingredientImpacts = [];
    for (const [inventoryItemId, deduction] of inventoryDeductions.entries()) {
      const invItem = await ctx.db.get(inventoryItemId as any);
      if (!invItem) continue;
      const remaining = (invItem as any).currentStock - deduction;
      ingredientImpacts.push({
        inventoryItemId,
        name: (invItem as any).name,
        unit: (invItem as any).unit,
        currentStock: (invItem as any).currentStock,
        deduction: Math.round(deduction * 100) / 100,
        remainingStock: Math.round(remaining * 100) / 100,
        insufficient: remaining < 0,
      });
    }

    const margin = totalRevenue - totalEstimatedCost;
    const marginPct = totalRevenue > 0 ? Math.round((margin / totalRevenue) * 100) : 0;

    return {
      ingredientImpacts,
      totals: {
        revenue: Math.round(totalRevenue * 100) / 100,
        cost: Math.round(totalEstimatedCost * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        marginPct,
      },
    };
  },
});
