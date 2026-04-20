// convex/seedJoe.ts  
import { internalMutation } from "./_generated/server";  
  
export default internalMutation({  
  args: {},  
  handler: async (ctx) => {  
    const now = Date.now();  
    const day = 86_400_000;  
  
    // ── Your existing user ID ─────────────────────────────────────  
    // Already in DB: kh75ngw891as6cmgj36r0b24v9856js4  
    const joeUserId = "kh75ngw891as6cmgj36r0b24v9856js4" as any;  
  
    // ── 1. Workspace ──────────────────────────────────────────────  
    const workspaceId = await ctx.db.insert("workspaces", {  
      name: "Joe's Kitchen",  
      slug: "joes-kitchen",  
      currency: "THB",  
      timezone: "Asia/Bangkok",  
      plan: "pro",  
      createdAt: now,  
    });  
  
    // ── 2. Workspace Membership ───────────────────────────────────  
    await ctx.db.insert("workspaceMemberships", {  
      workspaceId,  
      userId: joeUserId,  
      role: "owner",  
      joinedAt: now,  
    });  
  
    // ── 3. Suppliers ──────────────────────────────────────────────  
    const meatSupplier = await ctx.db.insert("suppliers", {  
      workspaceId,  
      displayId: "SUP-001",  
      name: "Bangkok Meat Supply",  
      category: "Meat",  
      contactName: "Somchai Prasert",  
      email: "somchai@bkkmeat.co.th",  
      phone: "+66-81-111-2222",  
      rating: 4.5,  
      status: "active",  
      leadTimeMinDays: 1,  
      leadTimeMaxDays: 3,  
      notes: "Premium pork and chicken",  
      createdAt: now,  
    });  
  
    const produceSupplier = await ctx.db.insert("suppliers", {  
      workspaceId,  
      displayId: "SUP-002",  
      name: "Fresh Farm Produce",  
      category: "Vegetables",  
      contactName: "Nattaya Sripan",  
      email: "nattaya@freshfarm.co.th",  
      phone: "+66-89-333-4444",  
      rating: 4.8,  
      status: "active",  
      leadTimeMinDays: 1,  
      leadTimeMaxDays: 2,  
      createdAt: now,  
    });  
  
    // ── 4. Inventory Items ────────────────────────────────────────  
    const rice = await ctx.db.insert("inventoryItems", {  
      workspaceId,  
      sku: "INV-RICE-001",  
      name: "Jasmine Rice",  
      category: "Dry Goods",  
      unit: "kg",  
      currentStock: 200,  
      minStockLevel: 50,  
      costPerUnit: 45,  
      createdAt: now,  
      updatedAt: now,  
    });  
  
    const chicken = await ctx.db.insert("inventoryItems", {  
      workspaceId,  
      sku: "INV-CHICKEN-001",  
      name: "Chicken Breast",  
      category: "Meat",  
      unit: "kg",  
      currentStock: 15,  
      minStockLevel: 10,  
      supplierId: meatSupplier,  
      costPerUnit: 120,  
      createdAt: now,  
      updatedAt: now,  
    });  
  
    const basil = await ctx.db.insert("inventoryItems", {  
      workspaceId,  
      sku: "INV-BASIL-001",  
      name: "Holy Basil",  
      category: "Vegetables",  
      unit: "g",  
      currentStock: 300,  
      minStockLevel: 200,  
      supplierId: produceSupplier,  
      costPerUnit: 0.5,  
      createdAt: now,  
      updatedAt: now,  
    });  
  
    const pork = await ctx.db.insert("inventoryItems", {  
      workspaceId,  
      sku: "INV-PORK-001",  
      name: "Minced Pork",  
      category: "Meat",  
      unit: "kg",  
      currentStock: 5,  
      minStockLevel: 10,  
      supplierId: meatSupplier,  
      costPerUnit: 140,  
      notes: "Low stock!",  
      createdAt: now,  
      updatedAt: now,  
    });  
  
    const egg = await ctx.db.insert("inventoryItems", {  
      workspaceId,  
      sku: "INV-EGG-001",  
      name: "Eggs",  
      category: "Dairy",  
      unit: "pcs",  
      currentStock: 60,  
      minStockLevel: 30,  
      costPerUnit: 5,  
      createdAt: now,  
      updatedAt: now,  
    });  
  
    // ── 5. Recipes ────────────────────────────────────────────────  
    const padKrapao = await ctx.db.insert("recipes", {  
      workspaceId,  
      displayId: "REC-001",  
      name: "Pad Kra Pao (Basil Stir-Fry)",  
      sku: "REC-KRAPAO",  
      category: "finished_goods",  
      price: 65,  
      yieldQty: 1,  
      yieldUnit: "plate",  
      isActive: true,  
      createdAt: now,  
    });  
    await ctx.db.insert("recipeIngredients", { recipeId: padKrapao, inventoryItemId: pork, quantity: 0.15, unit: "kg" });  
    await ctx.db.insert("recipeIngredients", { recipeId: padKrapao, inventoryItemId: basil, quantity: 30, unit: "g" });  
    await ctx.db.insert("recipeIngredients", { recipeId: padKrapao, inventoryItemId: rice, quantity: 0.2, unit: "kg" });  
    await ctx.db.insert("recipeIngredients", { recipeId: padKrapao, inventoryItemId: egg, quantity: 1, unit: "pcs" });  
  
    const chickenRice = await ctx.db.insert("recipes", {  
      workspaceId,  
      displayId: "REC-002",  
      name: "Khao Man Gai (Chicken Rice)",  
      sku: "REC-KHAOMANGAI",  
      category: "finished_goods",  
      price: 55,  
      yieldQty: 1,  
      yieldUnit: "plate",  
      isActive: true,  
      createdAt: now,  
    });  
    await ctx.db.insert("recipeIngredients", { recipeId: chickenRice, inventoryItemId: chicken, quantity: 0.2, unit: "kg" });  
    await ctx.db.insert("recipeIngredients", { recipeId: chickenRice, inventoryItemId: rice, quantity: 0.25, unit: "kg" });  
  
    // ── 6. Sellable Items ─────────────────────────────────────────  
    await ctx.db.insert("sellableItems", {  
      workspaceId,  
      displayId: "SELL-001",  
      name: "Pad Kra Pao",  
      sku: "SELL-KRAPAO",  
      purchaseCost: 30,  
      salePrice: 65,  
      profit: 35,  
      marginPct: 53.8,  
      trackStock: false,  
      currentStock: 0,  
      minStockLevel: 0,  
      isActive: true,  
      createdAt: now,  
      updatedAt: now,  
    });  
  
    // ── 7. Sales Transactions ─────────────────────────────────────  
    const sale1 = await ctx.db.insert("salesTransactions", {  
      workspaceId,  
      displayId: "SALE-0001",  
      customer: "Walk-in",  
      itemCount: 2,  
      totalAmount: 130,  
      totalCost: 60,  
      paymentMethod: "cash",  
      status: "completed",  
      createdAt: now - 1 * day,  
    });  
    await ctx.db.insert("saleItems", { transactionId: sale1, recipeId: padKrapao, quantity: 2, unitPrice: 65, subtotal: 130 });  
  
    const sale2 = await ctx.db.insert("salesTransactions", {  
      workspaceId,  
      displayId: "SALE-0002",  
      customer: "GrabFood Order",  
      itemCount: 3,  
      totalAmount: 185,  
      totalCost: 84,  
      paymentMethod: "mobile_pay",  
      status: "completed",  
      createdAt: now,  
    });  
    await ctx.db.insert("saleItems", { transactionId: sale2, recipeId: padKrapao, quantity: 1, unitPrice: 65, subtotal: 65 });  
    await ctx.db.insert("saleItems", { transactionId: sale2, recipeId: chickenRice, quantity: 2, unitPrice: 55, subtotal: 110 });  
  
    // ── 8. Stock Movements ────────────────────────────────────────  
    await ctx.db.insert("stockMovements", {  
      workspaceId,  
      inventoryItemId: rice,  
      type: "delivery",  
      quantity: 50,  
      note: "Weekly rice delivery",  
      performedBy: joeUserId,  
      createdAt: now - 3 * day,  
    });  
    await ctx.db.insert("stockMovements", {  
      workspaceId,  
      inventoryItemId: pork,  
      type: "sale",  
      quantity: -0.45,  
      referenceId: "SALE-0001",  
      note: "3x Pad Kra Pao",  
      performedBy: joeUserId,  
      createdAt: now - 1 * day,  
    });  
  
    // ── 9. Purchase Order ─────────────────────────────────────────  
    const po = await ctx.db.insert("purchaseOrders", {  
      workspaceId,  
      poNumber: "PO-2026-001",  
      supplierId: meatSupplier,  
      status: "sent",  
      totalAmount: 2800,  
      expectedDeliveryAt: now + 1 * day,  
      notes: "Minced pork running low",  
      createdBy: joeUserId,  
      createdAt: now,  
    });  
    await ctx.db.insert("purchaseOrderItems", {  
      purchaseOrderId: po,  
      inventoryItemId: pork,  
      quantity: 20,  
      unitCost: 140,  
      subtotal: 2800,  
    });  
  
    // ── 10. Alerts ────────────────────────────────────────────────  
    await ctx.db.insert("alerts", {  
      workspaceId,  
      displayId: "ALT-001",  
      category: "stock",  
      type: "low_stock",  
      severity: "high",  
      title: "Minced Pork below minimum",  
      description: "Minced Pork stock is 5 kg — below the minimum of 10 kg. PO-2026-001 has been sent.",  
      status: "open",  
      assignedTo: joeUserId,  
      relatedItemId: pork,  
      relatedEntityType: "inventory_item",  
      createdAt: now,  
    });  
  
    // ── 11. Forecast Snapshot ─────────────────────────────────────  
    const forecast = await ctx.db.insert("forecastSnapshots", {  
      workspaceId,  
      inventoryItemId: pork,  
      periodDays: 7,  
      predictedQty: 12,  
      unit: "kg",  
      trendPct: 15,  
      confidence: "high",  
      model: "moving_average_30d",  
      generatedAt: now,  
    });  
  
    // ── 12. Reorder Recommendation ────────────────────────────────  
    await ctx.db.insert("reorderRecommendations", {  
      workspaceId,  
      inventoryItemId: pork,  
      supplierId: meatSupplier,  
      forecastId: forecast,  
      recommendedQty: 20,  
      urgency: "high",  
      reason: "Current stock (5 kg) is 50% below minimum (10 kg). 7-day forecast predicts 12 kg demand.",  
      status: "accepted",  
      generatedAt: now,  
    });  
  
    console.log("Seed complete — Joe's Kitchen workspace ready.");  
  },  
});