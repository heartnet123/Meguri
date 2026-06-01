'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId, useWorkspaceLoading } from '@/app/providers/WorkspaceProvider';

type InventoryItem = {
  _id: string;
  name: string;
  unit: string;
  category: string;
  currentStock: number;
  costPerUnit?: number;
};

type Ingredient = {
  inventoryItemId: string;
  quantity: number;
  unit: string;
  _localId: string;
  inventoryItemName: string;
  inventoryItemUnit: string;
};

export type RecipeRow = {
  _id: Id<'recipes'>;
  displayId: string;
  sku: string;
  name: string;
  category: 'finished_goods' | 'bundles' | 'raw_materials';
  price: number;
  yieldQty: number;
  yieldUnit: string;
  isActive: boolean;
  ingredientCount: number;
  batchCost: number;
  unitCost: number;
  marginPct: number;
  ingredients?: Array<{
    _id: string;
    inventoryItemId: string;
    quantity: number;
    unit: string;
    inventoryItemName: string;
    inventoryItemUnit: string;
    inventoryItemCostPerUnit: number;
    lineCost: number;
  }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  recipe: RecipeRow | null; // null = create new
};

let localIdCounter = 0;
function nextLocalId() {
  return `ing_${++localIdCounter}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n);
}

function generateDisplayId() {
  return `RCP-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function RecipeEditorDialog({ isOpen, onClose, recipe }: Props) {
  const workspaceId = useWorkspaceId();
  const isWorkspaceLoading = useWorkspaceLoading();
  const addRecipe = useMutation(api.recipes.add);
  const updateRecipe = useMutation(api.recipes.update);

  // Fetch full recipe details when editing (to get ingredient list)
  const fullRecipe = useQuery(
    api.recipes.getById,
    isOpen && recipe ? { recipeId: recipe._id as Id<'recipes'> } : 'skip'
  );

  const inventoryItems = useQuery(
    api.inventory.list,
    isOpen && workspaceId ? { workspaceId } : 'skip'
  ) as InventoryItem[] | undefined;

  const [recipeName, setRecipeName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<'finished_goods' | 'bundles' | 'raw_materials'>('finished_goods');
  const [yieldQty, setYieldQty] = useState(1);
  const [yieldUnit, setYieldUnit] = useState('pcs');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    if (!recipe) {
      // Create mode
      setRecipeName('');
      setSku('');
      setPrice(0);
      setCategory('finished_goods');
      setYieldQty(1);
      setYieldUnit('pcs');
      setIngredients([]);
      setIngredientSearch('');
      setError(null);
    }
  }, [isOpen, recipe]);

  // Hydrate from existing recipe
  useEffect(() => {
    if (!isOpen || !fullRecipe) return;
    setRecipeName(fullRecipe.name);
    setSku(fullRecipe.sku || '');
    setPrice(fullRecipe.price || 0);
    setCategory(fullRecipe.category || 'finished_goods');
    setYieldQty(fullRecipe.yieldQty);
    setYieldUnit(fullRecipe.yieldUnit);
    setIngredients(
      (fullRecipe.ingredients ?? []).map((ing) => ({
        inventoryItemId: ing.inventoryItemId,
        quantity: ing.quantity,
        unit: ing.unit,
        _localId: nextLocalId(),
        inventoryItemName: ing.inventoryItemName,
        inventoryItemUnit: ing.inventoryItemUnit,
      }))
    );
    setIngredientSearch('');
    setError(null);
  }, [isOpen, fullRecipe]);

  const addIngredient = useCallback((item: InventoryItem) => {
    setIngredients((prev) => {
      if (prev.some((i) => i.inventoryItemId === item._id)) return prev;
      return [
        ...prev,
        {
          inventoryItemId: item._id,
          quantity: 1,
          unit: item.unit,
          _localId: nextLocalId(),
          inventoryItemName: item.name,
          inventoryItemUnit: item.unit,
        },
      ];
    });
    setIngredientSearch('');
  }, []);

  const removeIngredient = useCallback((localId: string) => {
    setIngredients((prev) => prev.filter((i) => i._localId !== localId));
  }, []);

  const updateIngredientQty = useCallback((localId: string, qty: number) => {
    setIngredients((prev) =>
      prev.map((i) => (i._localId === localId ? { ...i, quantity: qty } : i))
    );
  }, []);

  if (!isOpen) return null;

  const isRecipeLoading = recipe !== null && fullRecipe === undefined;
  const inventoryById = new Map((inventoryItems ?? []).map((item) => [item._id, item]));

  // Live cost calculations
  const batchCost = Number(
    ingredients
      .reduce((sum, ing) => {
        const item = inventoryById.get(ing.inventoryItemId);
        return sum + ing.quantity * (item?.costPerUnit ?? 0);
      }, 0)
      .toFixed(2)
  );
  const unitCost = yieldQty > 0 ? Number((batchCost / yieldQty).toFixed(2)) : 0;
  const margin = price - unitCost;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;

  const missingCostCount = ingredients.filter((ing) => {
    const item = inventoryById.get(ing.inventoryItemId);
    return item?.costPerUnit === undefined;
  }).length;

  const filteredItems = (inventoryItems ?? []).filter((item) => {
    const q = ingredientSearch.toLowerCase();
    return (
      !ingredients.some((i) => i.inventoryItemId === item._id) &&
      (q === '' || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    );
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWorkspaceLoading || isRecipeLoading) return;

    if (!workspaceId) {
      setError('ไม่พบเวิร์กสเปซที่กำลังใช้งาน');
      return;
    }
    if (ingredients.length === 0) {
      setError('กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ');
      return;
    }
    if (yieldQty <= 0) {
      setError('ปริมาณผลผลิตต้องมากกว่าศูนย์');
      return;
    }
    if (!recipeName.trim()) {
      setError('กรุณาระบุชื่อสินค้า');
      return;
    }
    if (!sku.trim()) {
      setError('กรุณาระบุ SKU');
      return;
    }

    setLoading(true);
    setError(null);

    const ingredientPayload = ingredients.map((i) => ({
      inventoryItemId: i.inventoryItemId as Id<'inventoryItems'>,
      quantity: i.quantity,
      unit: i.inventoryItemUnit || i.unit,
    }));

    try {
      if (recipe) {
        await updateRecipe({
          recipeId: recipe._id as Id<'recipes'>,
          name: recipeName,
          sku,
          price,
          category,
          yieldQty,
          yieldUnit,
          ingredients: ingredientPayload,
        });
      } else {
        await addRecipe({
          workspaceId: workspaceId as Id<'workspaces'>,
          displayId: generateDisplayId(),
          name: recipeName,
          sku,
          price,
          category,
          yieldQty,
          yieldUnit,
          ingredients: ingredientPayload,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-editor-title"
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-surface-raised">
          <div>
            <h2 id="recipe-editor-title" className="text-lg font-semibold text-foreground">
              {recipe ? 'แก้ไขสินค้าพร้อมขาย' : 'สร้างสินค้าพร้อมขาย'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              กำหนดชื่อ ราคา และส่วนผสมตาม BOM สำหรับสินค้านี้
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="text-muted hover:text-foreground transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" />
          </button>
        </div>

        {/* Body */}
        <div className="p-0 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 divide-x divide-border">
          {/* Left: General Config */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-danger-subtle/30 text-danger text-sm rounded-lg border border-danger/20 flex items-start gap-2">
                <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form id="recipe-editor-form" onSubmit={handleSave} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="recipe-name" className="text-xs font-black uppercase tracking-widest text-muted/60">
                    ชื่อสินค้า <span className="text-danger">*</span>
                  </label>
                  <input
                    id="recipe-name"
                    type="text"
                    required
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 bg-surface text-foreground"
                    placeholder="เช่น ลาเต้ซิกเนเจอร์"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="recipe-sku" className="text-xs font-black uppercase tracking-widest text-muted/60">
                      SKU <span className="text-danger">*</span>
                    </label>
                    <input
                      id="recipe-sku"
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 bg-surface text-foreground"
                      placeholder="LAT-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="recipe-category" className="text-xs font-black uppercase tracking-widest text-muted/60">
                      หมวดหมู่
                    </label>
                    <select
                      id="recipe-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="finished_goods">สินค้าสำเร็จรูป</option>
                      <option value="bundles">สินค้าชุด</option>
                      <option value="raw_materials">วัตถุดิบที่จำหน่ายได้</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="recipe-price" className="text-xs font-black uppercase tracking-widest text-muted/60">
                    ราคาขาย <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                    <input
                      id="recipe-price"
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/20 bg-surface text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="yield-qty" className="text-xs font-black uppercase tracking-widest text-muted/60">
                      ปริมาณผลผลิตต่อสูตร <span className="text-danger">*</span>
                    </label>
                    <input
                      id="yield-qty"
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      value={yieldQty}
                      onChange={(e) => setYieldQty(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 bg-surface text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="yield-unit" className="text-xs font-black uppercase tracking-widest text-muted/60">
                      หน่วยผลผลิต
                    </label>
                    <input
                      id="yield-unit"
                      type="text"
                      required
                      value={yieldUnit}
                      onChange={(e) => setYieldUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 bg-surface text-foreground"
                      placeholder="ชิ้น, แก้ว, เสิร์ฟ…"
                    />
                  </div>
                </div>
              </div>

              {/* Profit metrics */}
              <div className="rounded-xl border border-border bg-surface-raised/50 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted/60">ต้นทุนต่อหน่วย</div>
                    <div className="mt-1 text-xl font-bold text-foreground tabular-nums">{formatCurrency(unitCost)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted/60 text-right">กำไรขั้นต้น</div>
                    <div className={`mt-1 text-xl font-bold text-right tabular-nums ${marginPct >= 30 ? 'text-success' : marginPct >= 15 ? 'text-warning' : 'text-danger'}`}>
                      {marginPct}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${marginPct >= 30 ? 'bg-success' : marginPct >= 15 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${Math.min(Math.max(marginPct, 0), 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted italic leading-relaxed">
                  คำนวณจาก <strong className="text-foreground">{ingredients.length} วัตถุดิบ</strong>
                  {' '}กำไรต่อหน่วย: <strong className="text-foreground">{formatCurrency(margin)}</strong>
                </p>
              </div>
            </form>
          </div>

          {/* Right: BOM / Ingredients */}
          <div className="p-6 bg-surface-raised/30 space-y-4 flex flex-col min-h-0">
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  รายการวัตถุดิบ (BOM)
                  <span className="ml-1.5 text-xs font-normal text-muted">({ingredients.length} รายการ)</span>
                </h3>
              </div>

              {/* Search box */}
              <div className="relative">
                <iconify-icon
                  icon="solar:magnifer-linear"
                  width="16" height="16"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type="search"
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  placeholder="เพิ่มวัตถุดิบจากสินค้าคงคลัง…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-surface text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Dropdown results */}
              {ingredientSearch.length > 0 && filteredItems.length > 0 && (
                <div className="absolute z-10 w-[calc(50%-3rem)] left-[calc(50%+1.5rem)] mt-1 border border-border bg-surface rounded-lg overflow-hidden max-h-56 overflow-y-auto shadow-xl">
                  {filteredItems.slice(0, 10).map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => addIngredient(item)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-accent-subtle hover:text-accent transition-colors text-left border-b border-border/50 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="ml-2 text-[10px] text-muted uppercase font-bold">{item.category}</span>
                      </div>
                      <iconify-icon icon="solar:add-circle-linear" width="18" height="18" className="text-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Added ingredients list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {ingredients.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-2xl bg-surface/50">
                  <iconify-icon icon="solar:layers-minimalistic-linear" width="48" height="48" className="text-muted/30 mb-4" />
                  <p className="text-sm text-muted">ยังไม่มีการเพิ่มวัตถุดิบ</p>
                  <p className="text-xs text-muted/60 mt-1">ค้นหาด้านบนเพื่อเริ่มสร้างสูตรสินค้า</p>
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {ingredients.map((ing) => {
                    const item = inventoryById.get(ing.inventoryItemId);
                    const costPerUnit = item?.costPerUnit ?? 0;
                    const lineCost = ing.quantity * costPerUnit;
                    return (
                      <div key={ing._localId} className="group relative pr-10 pl-4 py-3 bg-surface border border-border rounded-xl transition-all hover:shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">{ing.inventoryItemName}</span>
                          <span className="text-xs font-bold text-success tabular-nums">{formatCurrency(lineCost)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={ing.quantity}
                              onChange={(e) => updateIngredientQty(ing._localId, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 bg-surface-raised border border-border rounded-md text-xs text-foreground focus:outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted uppercase pointer-events-none">
                              {ing.inventoryItemUnit}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted whitespace-nowrap">
                            x {formatCurrency(costPerUnit)}/{ing.inventoryItemUnit}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredient(ing._localId)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-danger hover:bg-danger-subtle rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                          aria-label={`ลบวัตถุดิบ ${ing.inventoryItemName}`}
                        >
                          <iconify-icon icon="solar:trash-bin-trash-linear" width="16" height="16" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-surface-raised shrink-0">
          <div className="text-xs text-muted">
             {ingredients.length > 0 
                ? `${ingredients.length} รายการวัตถุดิบ · ต้นทุนรวมต่อชุด: ${formatCurrency(batchCost)}`
                : 'ระบุวัตถุดิบเพื่อคำนวณต้นทุนต่อหน่วย'
             }
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="recipe-editor-form"
              disabled={loading || ingredients.length === 0 || isWorkspaceLoading || isRecipeLoading}
              className="px-6 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent/90 shadow-md shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(loading || isWorkspaceLoading) && (
                <iconify-icon icon="solar:refresh-circle-linear" width="16" height="16" className="animate-spin" />
              )}
              {recipe ? 'อัปเดตสินค้า' : 'สร้างสินค้า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
