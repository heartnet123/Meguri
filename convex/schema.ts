import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ─── MULTI-TENANT ────────────────────────────────────────────────────────────

  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),           // used in join-workspace URL
    currency: v.string(),       // e.g. "THB", "USD"
    timezone: v.string(),
    plan: v.union(
      v.literal('free'),
      v.literal('pro'),
      v.literal('enterprise'),
    ),
    createdAt: v.number(),
  }).index('by_slug', ['slug']),

  // ─── USERS & AUTH ────────────────────────────────────────────────────────────

  users: defineTable({
    workspaceId: v.id('workspaces'),
    clerkId: v.optional(v.string()),  // external auth provider ID
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal('owner'),
      v.literal('admin'),
      v.literal('manager'),
      v.literal('staff'),
    ),
    avatarUrl: v.optional(v.string()),
    notificationsEnabled: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_email', ['email'])
    .index('by_clerk_id', ['clerkId']),

  // ─── SUPPLIERS ───────────────────────────────────────────────────────────────

  suppliers: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),          // e.g. "SUP-001" shown in UI
    name: v.string(),
    category: v.string(),           // Raw Materials, Packaging, Perishables, Ingredients
    contactName: v.string(),
    email: v.string(),
    phone: v.string(),
    rating: v.number(),             // 0.0 – 5.0
    status: v.union(
      v.literal('active'),
      v.literal('needs_review'),
      v.literal('inactive'),
    ),
    leadTimeMinDays: v.number(),    // lead time stored as range e.g. {1, 2}
    leadTimeMaxDays: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_status', ['workspaceId', 'status']),

  // ─── INVENTORY ITEMS (raw materials / stock items) ───────────────────────────

  inventoryItems: defineTable({
    workspaceId: v.id('workspaces'),
    sku: v.string(),                // e.g. "DAI-001"
    name: v.string(),
    category: v.string(),           // Dairy, Coffee, Bakery, Packaging, Ingredients
    unit: v.string(),               // kg, L, pcs, btl
    currentStock: v.number(),
    minStockLevel: v.number(),      // reorder threshold
    supplierId: v.optional(v.id('suppliers')),
    costPerUnit: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_sku', ['workspaceId', 'sku'])
    .index('by_workspace_category', ['workspaceId', 'category']),

  // ─── PRODUCTS (finished goods, bundles, for-sale items) ──────────────────────

  products: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),          // e.g. "PRD-001"
    name: v.string(),
    sku: v.string(),
    category: v.union(
      v.literal('finished_goods'),
      v.literal('bundles'),
      v.literal('raw_materials'),
    ),
    price: v.number(),              // selling price
    cost: v.number(),               // production/purchase cost
    currentStock: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_sku', ['workspaceId', 'sku']),

  // ─── RECIPES (how products are made from inventory items) ────────────────────

  recipes: defineTable({
    workspaceId: v.id('workspaces'),
    productId: v.id('products'),
    name: v.string(),
    yieldQty: v.number(),           // units produced per batch
    yieldUnit: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index('by_product', ['productId']),

  recipeIngredients: defineTable({
    recipeId: v.id('recipes'),
    inventoryItemId: v.id('inventoryItems'),
    quantity: v.number(),
    unit: v.string(),
  }).index('by_recipe', ['recipeId']),

  // ─── SALES TRANSACTIONS ──────────────────────────────────────────────────────

  salesTransactions: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),          // e.g. "TRX-8921"
    customer: v.string(),           // "Walk-in Customer" or named
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
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_date', ['workspaceId', 'createdAt'])
    .index('by_workspace_status', ['workspaceId', 'status']),

  saleItems: defineTable({
    transactionId: v.id('salesTransactions'),
    productId: v.id('products'),
    quantity: v.number(),
    unitPrice: v.number(),
    subtotal: v.number(),
  }).index('by_transaction', ['transactionId']),

  // ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

  purchaseOrders: defineTable({
    workspaceId: v.id('workspaces'),
    poNumber: v.string(),           // e.g. "PO-2094"
    supplierId: v.id('suppliers'),
    status: v.union(
      v.literal('draft'),
      v.literal('sent'),
      v.literal('pending'),
      v.literal('received'),
      v.literal('cancelled'),
    ),
    totalAmount: v.optional(v.number()),
    expectedDeliveryAt: v.optional(v.number()),
    receivedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_status', ['workspaceId', 'status'])
    .index('by_supplier', ['supplierId']),

  purchaseOrderItems: defineTable({
    purchaseOrderId: v.id('purchaseOrders'),
    inventoryItemId: v.id('inventoryItems'),
    quantity: v.number(),
    unitCost: v.number(),
    subtotal: v.number(),
    receivedQuantity: v.optional(v.number()),  // filled when PO is received
  }).index('by_purchase_order', ['purchaseOrderId']),

  // ─── STOCK MOVEMENTS (audit log) ─────────────────────────────────────────────

  stockMovements: defineTable({
    workspaceId: v.id('workspaces'),
    inventoryItemId: v.id('inventoryItems'),
    type: v.union(
      v.literal('delivery'),    // received from a PO
      v.literal('sale'),        // consumed by a sale
      v.literal('adjustment'),  // manual stock correction
      v.literal('wastage'),     // spoilage / waste
      v.literal('transfer'),    // between locations
    ),
    quantity: v.number(),         // positive = stock in, negative = stock out
    referenceId: v.optional(v.string()),  // e.g. PO number or TRX display ID
    note: v.optional(v.string()),
    performedBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_item', ['inventoryItemId'])
    .index('by_workspace_date', ['workspaceId', 'createdAt']),

  // ─── ALERTS ──────────────────────────────────────────────────────────────────

  alerts: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),          // e.g. "ALT-1042"
    type: v.union(
      v.literal('low_stock'),
      v.literal('unusual_demand'),
      v.literal('supplier'),
      v.literal('price_change'),
      v.literal('system'),
    ),
    severity: v.union(
      v.literal('critical'),
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
    ),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal('open'),
      v.literal('resolved'),
    ),
    relatedItemId: v.optional(v.id('inventoryItems')),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id('users')),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_status', ['workspaceId', 'status'])
    .index('by_workspace_severity', ['workspaceId', 'severity']),

  // ─── DEMAND FORECASTS (AI-generated snapshots) ───────────────────────────────

  forecastSnapshots: defineTable({
    workspaceId: v.id('workspaces'),
    inventoryItemId: v.id('inventoryItems'),
    periodDays: v.number(),         // 7, 14, or 30
    predictedQty: v.number(),
    unit: v.string(),
    trendPct: v.optional(v.number()),   // e.g. 15 = +15%, -2 = -2%
    confidence: v.union(
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
    ),
    model: v.string(),              // "SARIMA", "XGBoost", "Moving Average", "Baseline"
    warning: v.optional(v.string()),
    generatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_item_date', ['inventoryItemId', 'generatedAt']),

  // ─── REORDER RECOMMENDATIONS (AI purchase planning) ──────────────────────────

  reorderRecommendations: defineTable({
    workspaceId: v.id('workspaces'),
    inventoryItemId: v.id('inventoryItems'),
    supplierId: v.optional(v.id('suppliers')),
    forecastId: v.optional(v.id('forecastSnapshots')),
    recommendedQty: v.number(),
    urgency: v.union(
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
    ),
    reason: v.string(),             // AI-generated explanation
    status: v.union(
      v.literal('pending'),         // awaiting user action
      v.literal('accepted'),        // added to a draft PO
      v.literal('dismissed'),
    ),
    generatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_status', ['workspaceId', 'status']),
});
