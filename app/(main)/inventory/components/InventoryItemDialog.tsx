import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId, useWorkspaceLoading } from '@/app/providers/WorkspaceProvider';

type Item = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  costPerUnit?: number;
  notes?: string;
  supplierId?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Item | null;
};

export function InventoryItemDialog({ isOpen, onClose, item }: Props) {
  const workspaceId = useWorkspaceId();
  const isWorkspaceLoading = useWorkspaceLoading();
  const add = useMutation(api.inventory.add);
  const update = useMutation(api.inventory.update);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(0);
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSku(item.sku);
      setCategory(item.category);
      setUnit(item.unit);
      setCurrentStock(item.currentStock);
      setMinStockLevel(item.minStockLevel);
      setCostPerUnit(item.costPerUnit ?? 0);
      setNotes(item.notes ?? '');
    } else {
      setName('');
      setSku('');
      setCategory('');
      setUnit('');
      setCurrentStock(0);
      setMinStockLevel(0);
      setCostPerUnit(0);
      setNotes('');
    }
    setError(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isWorkspaceLoading) return;
    
    if (!workspaceId) {
      setError('No active workspace found. Please complete onboarding or contact support.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (item) {
        await update({
          id: item._id as Id<"inventoryItems">,
          name,
          sku,
          category,
          unit,
          minStockLevel,
          costPerUnit: costPerUnit || undefined,
          notes: notes || undefined,
        });
      } else {
        await add({
          workspaceId: workspaceId as Id<"workspaces">,
          name,
          sku,
          category,
          unit,
          currentStock,
          minStockLevel,
          costPerUnit: costPerUnit || undefined,
          notes: notes || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      // Surface permission issues with a friendlier message
      if (message.includes('Forbidden')) {
        setError('You do not have permission to perform this action. Manager role or higher required.');
      } else if (message.includes('Unauthenticated')) {
        setError('You are not signed in. Please refresh the page and sign in.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {item ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
              <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="inventory-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  placeholder="e.g. Arabica Beans"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  placeholder="e.g. COF-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category *</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  placeholder="e.g. Coffee"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Unit *</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  placeholder="e.g. kg, L, pcs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Initial Stock {item ? '(Not editable here)' : '*'}</label>
                <input
                  type="number"
                  required={!item}
                  disabled={!!item}
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground disabled:bg-surface-raised disabled:text-muted bg-surface text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Min Stock Level *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cost Per Unit</label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                placeholder="Optional notes..."
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-surface-raised mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors"
          >
            Cancel
          </button>
            <button
              type="submit"
              form="inventory-form"
              disabled={loading || isWorkspaceLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(loading || isWorkspaceLoading) && (
                <iconify-icon icon="solar:refresh-circle-linear" width="16" height="16" className="animate-spin" />
              )}
              {isWorkspaceLoading ? 'Syncing...' : loading ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
            </button>
        </div>
      </div>
    </div>
  );
}
