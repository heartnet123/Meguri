import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    currency: v.string(),
    timezone: v.string(),
    plan: v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise')),
    createdAt: v.number(),
  }).index('by_slug', ['slug']),

  users: defineTable({
    workspaceId: v.optional(v.id('workspaces')),
    betterAuthId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('manager'), v.literal('staff')),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    currency: v.optional(v.string()),
    dateFormat: v.optional(v.string()),
    notificationsEnabled: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_email', ['email'])
    .index('by_better_auth_id', ['betterAuthId']),

  workspaceMemberships: defineTable({
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('manager'), v.literal('staff')),
    joinedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_user', ['userId'])
    .index('by_user_workspace', ['userId', 'workspaceId']),

  invitations: defineTable({
    workspaceId: v.id('workspaces'),
    email: v.string(),
    role: v.union(v.literal('admin'), v.literal('manager'), v.literal('staff')),
    token: v.string(),
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('cancelled')),
    invitedBy: v.id('users'),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_token', ['token'])
    .index('by_email', ['email']),

  suppliers: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    name: v.string(),
    category: v.string(),
    contactName: v.string(),
    email: v.string(),
    phone: v.string(),
    rating: v.number(),
    status: v.union(v.literal('active'), v.literal('needs_review'), v.literal('inactive')),
    leadTimeMinDays: v.number(),
    leadTimeMaxDays: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_status', ['workspaceId', 'status']),

  inventoryItems: defineTable({
    workspaceId: v.id('workspaces'),
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    unit: v.string(),
    currentStock: v.number(),
    minStockLevel: v.number(),
    isArchived: v.optional(v.boolean()),
    supplierId: v.optional(v.id('suppliers')),
    costPerUnit: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_and_is_archived', ['workspaceId', 'isArchived'])
    .index('by_workspace_sku', ['workspaceId', 'sku'])
    .index('by_workspace_category', ['workspaceId', 'category']),

  sellableItems: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    name: v.string(),
    sku: v.string(),
    purchaseCost: v.number(),
    salePrice: v.number(),
    profit: v.number(),
    marginPct: v.number(),
    trackStock: v.boolean(),
    currentStock: v.number(),
    minStockLevel: v.number(),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_sku', ['workspaceId', 'sku'])
    .index('by_workspace_active', ['workspaceId', 'isActive']),

  recipes: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    name: v.string(),
    sku: v.string(),
    category: v.union(v.literal('finished_goods'), v.literal('bundles'), v.literal('raw_materials')),
    price: v.number(),
    yieldQty: v.number(),
    yieldUnit: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_workspace', ['workspaceId']).index('by_workspace_sku', ['workspaceId', 'sku']),

  recipeIngredients: defineTable({
    recipeId: v.id('recipes'),
    inventoryItemId: v.id('inventoryItems'),
    quantity: v.number(),
    unit: v.string(),
  }).index('by_recipe', ['recipeId']),

  salesTransactions: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    customer: v.string(),
    itemCount: v.number(),
    totalAmount: v.number(),
    totalCost: v.optional(v.number()),
    paymentMethod: v.union(v.literal('cash'), v.literal('credit_card'), v.literal('mobile_pay'), v.literal('invoice')),
    status: v.union(v.literal('completed'), v.literal('pending'), v.literal('refunded'), v.literal('cancelled')),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_date', ['workspaceId', 'createdAt'])
    .index('by_workspace_status', ['workspaceId', 'status']),

  saleItems: defineTable({
    transactionId: v.id('salesTransactions'),
    recipeId: v.optional(v.id('recipes')),
    sellableItemId: v.optional(v.id('sellableItems')),
    quantity: v.number(),
    unitPrice: v.number(),
    subtotal: v.number(),
  })
    .index('by_transaction', ['transactionId'])
    .index('by_recipe', ['recipeId'])
    .index('by_sellable_item', ['sellableItemId']),

  purchaseOrders: defineTable({
    workspaceId: v.id('workspaces'),
    poNumber: v.string(),
    supplierId: v.id('suppliers'),
    status: v.union(v.literal('draft'), v.literal('sent'), v.literal('pending'), v.literal('received'), v.literal('cancelled')),
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
    receivedQuantity: v.optional(v.number()),
  }).index('by_purchase_order', ['purchaseOrderId']),

  stockMovements: defineTable({
    workspaceId: v.id('workspaces'),
    inventoryItemId: v.id('inventoryItems'),
    type: v.union(v.literal('delivery'), v.literal('sale'), v.literal('adjustment'), v.literal('wastage'), v.literal('transfer'), v.literal('initial_stock'), v.literal('archive')),
    quantity: v.number(),
    referenceId: v.optional(v.string()),
    note: v.optional(v.string()),
    performedBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_item', ['inventoryItemId'])
    .index('by_workspace_inventory_item', ['workspaceId', 'inventoryItemId'])
    .index('by_workspace_date', ['workspaceId', 'createdAt']),

  alerts: defineTable({
    workspaceId: v.id('workspaces'),
    displayId: v.string(),
    category: v.union(v.literal('stock'), v.literal('anomaly'), v.literal('supplier'), v.literal('system')),
    type: v.union(v.literal('low_stock'), v.literal('unusual_demand'), v.literal('supplier'), v.literal('price_change'), v.literal('system')),
    severity: v.union(v.literal('critical'), v.literal('high'), v.literal('medium'), v.literal('low')),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal('open'), v.literal('resolved')),
    assignedTo: v.optional(v.id('users')),
    relatedItemId: v.optional(v.id('inventoryItems')),
    relatedEntityType: v.optional(v.union(v.literal('inventory_item'), v.literal('supplier'), v.literal('dashboard'), v.literal('forecast'), v.literal('system'))),
    relatedEntityId: v.optional(v.string()),
    resolutionNote: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id('users')),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_status', ['workspaceId', 'status'])
    .index('by_workspace_status_and_severity', ['workspaceId', 'status', 'severity'])
    .index('by_workspace_status_and_category', ['workspaceId', 'status', 'category'])
    .index('by_workspace_status_related_item_type', ['workspaceId', 'status', 'relatedItemId', 'type'])
    .index('by_workspace_severity', ['workspaceId', 'severity'])
    .index('by_workspace_category', ['workspaceId', 'category'])
    .index('by_workspace_assigned_to', ['workspaceId', 'assignedTo']),

  forecastSnapshots: defineTable({
    workspaceId: v.id('workspaces'),
    inventoryItemId: v.id('inventoryItems'),
    periodDays: v.number(),
    predictedQty: v.number(),
    unit: v.string(),
    trendPct: v.optional(v.number()),
    confidence: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    model: v.string(),
    warning: v.optional(v.string()),
    generatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_item_date', ['inventoryItemId', 'generatedAt']),

  reorderRecommendations: defineTable({
    workspaceId: v.id('workspaces'),
    inventoryItemId: v.id('inventoryItems'),
    supplierId: v.optional(v.id('suppliers')),
    forecastId: v.optional(v.id('forecastSnapshots')),
    recommendedQty: v.number(),
    urgency: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    reason: v.string(),
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('dismissed')),
    generatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_status', ['workspaceId', 'status']),
});
