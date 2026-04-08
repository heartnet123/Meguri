import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

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
    if (!workspaceId) return;

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {item ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form id="inventory-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="e.g. Arabica Beans"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="e.g. COF-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Category *</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="e.g. Coffee"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Unit *</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="e.g. kg, L, pcs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Initial Stock {item ? '(Not editable here)' : '*'}</label>
                <input
                  type="number"
                  required={!item}
                  disabled={!!item}
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Min Stock Level *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Cost Per Unit</label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Optional notes..."
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3 bg-neutral-50 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="inventory-form"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
