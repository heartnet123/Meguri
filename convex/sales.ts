import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
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
  args: { workspaceId: v.id('workspaces'), startOfDayMs: v.number() },
  handler: async (ctx, { workspaceId, startOfDayMs }) => {
    await verifyWorkspace(ctx, workspaceId);

    const all = await ctx.db
      .query('salesTransactions')
      .withIndex('by_workspace_date', (q) => q.eq('workspaceId', workspaceId))
      .filter((q) => q.gte(q.field('createdAt'), startOfDayMs))
      .collect();

    const completed = all.filter((t) => t.status === 'completed');
    const revenue = completed.reduce((s, t) => s + t.totalAmount, 0);
    const orderCount = completed.length;
    const avgOrder = orderCount > 0 ? revenue / orderCount : 0;

    return { revenue, orderCount, avgOrder };
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
      v.literal('invoice')
    ),
    status: v.union(
      v.literal('completed'),
      v.literal('pending'),
      v.literal('refunded'),
      v.literal('cancelled')
    ),
    items: v.optional(v.array(
      v.object({
        productId: v.id('products'),
        quantity: v.number(),
        unitPrice: v.number(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const user = await verifyWorkspace(ctx, args.workspaceId);
    checkRole(user, ['owner', 'admin', 'manager', 'staff']);

    // 1. Initial validation of all items
    if (args.items && args.items.length > 0) {
      for (const item of args.items) {
        if (item.quantity <= 0) throw new Error(`Invalid item quantity for product ${item.productId}: ${item.quantity}. Must be > 0.`);
        if (item.unitPrice <= 0) throw new Error(`Invalid unit price for product ${item.productId}: ${item.unitPrice}. Must be > 0.`);
        
        const product = await ctx.db.get(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
      }
    }

    // Map to keep track of required inventory items
    const inventoryDeductions = new Map<string, number>();
    // Cache for validated inventory items to avoid re-fetching
    const inventoryItemCache = new Map<string, any>();

    // Map to keep track of product stock deductions
    const productDeductions = new Map<string, number>();
    // Cache for product records if needed
    const productCache = new Map<string, any>();

    if (args.status === 'completed' && args.items && args.items.length > 0) {
      for (const item of args.items) {
        const product = (await ctx.db.get(item.productId))!; // Already validated above
        productCache.set(item.productId, product);

        // Try to find an active recipe for this product
        const recipes = await ctx.db
          .query('recipes')
          .withIndex('by_product', (q) => q.eq('productId', item.productId))
          .filter((q) => q.eq(q.field('isActive'), true))
          .collect();

        if (recipes.length > 0) {
          // If product has a recipe, it's made from inventory items
          const recipe = recipes[0]; // Assuming only one active recipe per product

          if (recipe.yieldQty <= 0) {
            throw new Error(`Invalid recipe yield for product ${product.name} (Recipe: ${recipe._id}). Yield must be > 0.`);
          }

          const ingredients = await ctx.db
            .query('recipeIngredients')
            .withIndex('by_recipe', (q) => q.eq('recipeId', recipe._id))
            .collect();

          for (const ingredient of ingredients) {
            const requiredQty = (item.quantity / recipe.yieldQty) * ingredient.quantity;
            const currentReq = inventoryDeductions.get(ingredient.inventoryItemId) || 0;
            inventoryDeductions.set(ingredient.inventoryItemId, currentReq + requiredQty);
          }
        } else {
          // If no recipe, we might deduct from product's direct stock
          const currentReq = productDeductions.get(item.productId) || 0;
          productDeductions.set(item.productId, currentReq + item.quantity);
        }
      }

      // Check stock sufficiency for inventory items
      for (const [inventoryItemId, requiredQty] of inventoryDeductions.entries()) {
        const invItem = (await ctx.db.get(inventoryItemId as any)) as any;
        if (!invItem) throw new Error(`Inventory item not found: ${inventoryItemId}`);
        inventoryItemCache.set(inventoryItemId, invItem);
        
        if (invItem.currentStock < requiredQty) {
          throw new Error(`Insufficient stock for ingredient: ${invItem.name}. Required: ${requiredQty}, Available: ${invItem.currentStock}`);
        }
      }

      // Check stock sufficiency for products sold directly
      for (const [productId, requiredQty] of productDeductions.entries()) {
        const product = productCache.get(productId) as any;
        if (product.currentStock < requiredQty) {
          throw new Error(`Insufficient stock for product: ${product.name}. Required: ${requiredQty}, Available: ${product.currentStock}`);
        }
      }
    }

    const now = Date.now();
    const { items, ...transactionArgs } = args;

    // 1. Create Transaction
    const transactionId = await ctx.db.insert('salesTransactions', {
      ...transactionArgs,
      createdAt: now
    });

    if (items && items.length > 0) {
      // 2. Create Sale Items
      for (const item of items) {
        await ctx.db.insert('saleItems', {
          transactionId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        });
      }

      if (args.status === 'completed') {
        // 3. Deduct Inventory Items & Record Stock Movements
        for (const [inventoryItemId, deductionQty] of inventoryDeductions.entries()) {
          const invItem = inventoryItemCache.get(inventoryItemId) as any;
          // Deduction quantity might be 0 for some items, but typically it will be > 0 if in the map
          await ctx.db.patch(invItem._id, {
            currentStock: invItem.currentStock - deductionQty,
            updatedAt: now,
          });

          await ctx.db.insert('stockMovements', {
            workspaceId: args.workspaceId,
            inventoryItemId: invItem._id,
            type: 'sale',
            quantity: -deductionQty, // negative for deductions
            referenceId: args.displayId,
            performedBy: user._id,
            createdAt: now,
          });
        }

        // 4. Deduct Product Stock (if sold directly without recipe)
        for (const [productId, deductionQty] of productDeductions.entries()) {
          const product = productCache.get(productId) as any;
          await ctx.db.patch(product._id, {
            currentStock: product.currentStock - deductionQty,
            updatedAt: now,
          });
        }
      }
    }

    return transactionId;
  },
});
