'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId, useWorkspaceLoading } from '@/app/providers/WorkspaceProvider';

type Product = {
  _id: string;
  name: string;
  displayId: string;
};

type InventoryItem = {
  _id: string;
  name: string;
  unit: string;
  category: string;
  currentStock: number;
};

type Ingredient = {
  inventoryItemId: string;
  quantity: number;
  unit: string;
  // local UI only
  _localId: string;
  inventoryItemName: string;
  inventoryItemUnit: string;
};

type ExistingRecipe = {
  _id: string;
  name: string;
  yieldQty: number;
  yieldUnit: string;
  isActive: boolean;
  ingredients: Array<{
    _id: string;
    inventoryItemId: string;
    quantity: number;
    unit: string;
    inventoryItemName: string;
    inventoryItemUnit: string;
  }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  existingRecipe?: ExistingRecipe | null;
};

let localIdCounter = 0;
function nextLocalId() {
  return `ing_${++localIdCounter}`;
}

export function RecipeEditorDialog({ isOpen, onClose, product, existingRecipe }: Props) {
  const workspaceId = useWorkspaceId();
  const isWorkspaceLoading = useWorkspaceLoading();
  const addRecipe = useMutation(api.recipes.add);
  const updateRecipe = useMutation(api.recipes.update);

  const inventoryItems = useQuery(
    api.inventory.list,
    workspaceId ? { workspaceId } : 'skip'
  ) as InventoryItem[] | undefined;

  const [recipeName, setRecipeName] = useState('');
  const [yieldQty, setYieldQty] = useState(1);
  const [yieldUnit, setYieldUnit] = useState('pcs');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate from existing recipe
  useEffect(() => {
    if (!isOpen) return;
    if (existingRecipe) {
      setRecipeName(existingRecipe.name);
      setYieldQty(existingRecipe.yieldQty);
      setYieldUnit(existingRecipe.yieldUnit);
      setIngredients(
        existingRecipe.ingredients.map((ing) => ({
          inventoryItemId: ing.inventoryItemId,
          quantity: ing.quantity,
          unit: ing.unit,
          _localId: nextLocalId(),
          inventoryItemName: ing.inventoryItemName,
          inventoryItemUnit: ing.inventoryItemUnit,
        }))
      );
    } else {
      setRecipeName(product ? `${product.name} Recipe` : '');
      setYieldQty(1);
      setYieldUnit('pcs');
      setIngredients([]);
    }
    setIngredientSearch('');
    setError(null);
  }, [isOpen, existingRecipe, product]);

  const addIngredient = useCallback((item: InventoryItem) => {
    setIngredients((prev) => {
      // Prevent duplicates
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

  const updateIngredientUnit = useCallback((localId: string, unit: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i._localId === localId ? { ...i, unit } : i))
    );
  }, []);

  if (!isOpen || !product) return null;

  const filteredItems = (inventoryItems ?? []).filter((item) => {
    const q = ingredientSearch.toLowerCase();
    return (
      !ingredients.some((i) => i.inventoryItemId === item._id) &&
      (q === '' || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    );
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWorkspaceLoading) return;
    
    if (!workspaceId) {
      setError('No active workspace found. Please complete onboarding or contact support.');
      return;
    }
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient.');
      return;
    }
    if (yieldQty <= 0) {
      setError('Yield quantity must be greater than zero.');
      return;
    }

    setLoading(true);
    setError(null);

    const ingredientPayload = ingredients.map((i) => ({
      inventoryItemId: i.inventoryItemId as Id<'inventoryItems'>,
      quantity: i.quantity,
      unit: i.unit,
    }));

    try {
      if (existingRecipe) {
        await updateRecipe({
          recipeId: existingRecipe._id as Id<'recipes'>,
          name: recipeName,
          yieldQty,
          yieldUnit,
          ingredients: ingredientPayload,
        });
      } else {
        await addRecipe({
          workspaceId: workspaceId as Id<'workspaces'>,
          productId: product._id as Id<'products'>,
          name: recipeName,
          yieldQty,
          yieldUnit,
          ingredients: ingredientPayload,
        });
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-dialog-title"
    >
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface-raised">
          <div>
            <h2 id="recipe-dialog-title" className="text-lg font-semibold text-foreground">
              {existingRecipe ? 'Edit Recipe' : 'Create Recipe'}
            </h2>
            <p className="text-xs text-muted mt-0.5">For: {product.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted hover:text-foreground transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
              <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="recipe-form" onSubmit={handleSave} className="space-y-6">
            {/* Recipe name + yield */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="recipe-name" className="text-sm font-medium text-foreground">Recipe Name *</label>
                <input
                  id="recipe-name"
                  type="text"
                  required
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  placeholder="e.g. Standard Latte Recipe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="yield-qty" className="text-sm font-medium text-foreground">Yield Quantity *</label>
                  <input
                    id="yield-qty"
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={yieldQty}
                    onChange={(e) => setYieldQty(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="yield-unit" className="text-sm font-medium text-foreground">Yield Unit *</label>
                  <input
                    id="yield-unit"
                    type="text"
                    required
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                    placeholder="e.g. cups, pcs, servings"
                  />
                </div>
              </div>
            </div>

            {/* Ingredient picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Ingredients
                  <span className="ml-1.5 text-xs font-normal text-muted">({ingredients.length} added)</span>
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
                  placeholder="Search inventory items to add…"
                  aria-label="Search inventory items"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-surface text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>

              {/* Dropdown results */}
              {(ingredientSearch.length > 0 || filteredItems.length <= 6) && filteredItems.length > 0 && (
                <div className="border border-border bg-surface rounded-lg overflow-hidden max-h-44 overflow-y-auto shadow-sm">
                  {filteredItems.slice(0, 20).map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => addIngredient(item)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent-subtle hover:text-accent transition-colors text-left border-b border-border/50 last:border-0"
                    >
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="text-xs text-muted">
                        {item.currentStock.toLocaleString()} {item.unit} available
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {inventoryItems === undefined && (
                <div className="flex items-center gap-2 text-sm text-muted py-2">
                  <iconify-icon icon="solar:refresh-circle-linear" width="16" height="16" className="animate-spin" />
                  Loading inventory…
                </div>
              )}

              {inventoryItems && inventoryItems.length === 0 && (
                <div className="text-sm text-muted py-2">
                  No inventory items found. Add items in the <strong>Inventory</strong> section first.
                </div>
              )}

              {/* Added ingredients list */}
              {ingredients.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted uppercase tracking-wide px-1">
                    Added Ingredients
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden divide-y divide-border/50">
                    {ingredients.map((ing) => (
                      <div key={ing._localId} className="flex items-center gap-3 px-4 py-3 bg-surface">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ing.inventoryItemName}</p>
                          <p className="text-xs text-muted mt-0.5">per {yieldQty} {yieldUnit}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={ing.quantity}
                            onChange={(e) =>
                              updateIngredientQty(ing._localId, parseFloat(e.target.value) || 0)
                            }
                            aria-label={`Quantity for ${ing.inventoryItemName}`}
                            className="w-20 px-2 py-1.5 border border-border bg-surface text-foreground rounded-md text-sm text-right focus:outline-none focus:ring-2 focus:ring-foreground"
                          />
                          <input
                            type="text"
                            value={ing.unit}
                            onChange={(e) => updateIngredientUnit(ing._localId, e.target.value)}
                            aria-label={`Unit for ${ing.inventoryItemName}`}
                            className="w-16 px-2 py-1.5 border border-border bg-surface text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => removeIngredient(ing._localId)}
                            aria-label={`Remove ${ing.inventoryItemName}`}
                            className="p-1.5 text-muted hover:text-danger hover:bg-danger-subtle rounded-md transition-colors"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-linear" width="16" height="16" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted px-1">
                    Quantities above are required per <strong>{yieldQty} {yieldUnit}</strong> of yield.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-surface-raised shrink-0">
          <div className="text-xs text-muted">
            {ingredients.length === 0 ? 'Add ingredients to continue' : `${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''}`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="recipe-form"
              disabled={loading || ingredients.length === 0 || isWorkspaceLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(loading || isWorkspaceLoading) && (
                <iconify-icon icon="solar:refresh-circle-linear" width="16" height="16" className="animate-spin" />
              )}
              {isWorkspaceLoading ? 'Syncing...' : loading ? 'Saving...' : existingRecipe ? 'Update Recipe' : 'Save Recipe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
