import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Item = {
  _id: string;
  name: string;
  currentStock: number;
  unit: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
};

export function AdjustStockDialog({ isOpen, onClose, item }: Props) {
  const adjustStock = useMutation(api.inventory.adjustStock);

  const [type, setType] = useState<'adjustment' | 'wastage'>('adjustment');
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity === 0) {
      setError('Quantity cannot be zero');
      return;
    }
    if (type === 'wastage' && quantity > 0) {
      setError('Wastage quantity should be negative or recorded as a loss');
      // Wait, let's just make sure quantity is correctly interpreted.
    }

    setLoading(true);
    setError(null);
    try {
      // For wastage, if they entered a positive number, we'll convert it to negative in the mutation or here.
      // Let's pass the quantity as they entered it, and the mutation can handle it, or we enforce sign.
      // Actually, if it's wastage, it usually means reducing stock. So we can expect positive input and subtract it.
      const adjustedQty = type === 'wastage' ? -Math.abs(quantity) : quantity;

      await adjustStock({
        id: item._id as Id<"inventoryItems">,
        type,
        quantity: adjustedQty,
        note: note || undefined,
      });
      onClose();
      // Reset form
      setQuantity(0);
      setNote('');
      setType('adjustment');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl border border-border w-full max-w-sm overflow-hidden flex flex-col translate-y-[-10%] sm:translate-y-0">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
          <h2 className="text-lg font-semibold text-foreground">
            Adjust Stock
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface-raised"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted mb-4">
            Current stock for <strong className="text-foreground">{item.name}</strong>: <span className="text-foreground font-medium">{item.currentStock} {item.unit}</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-danger-subtle text-danger text-sm rounded-lg border border-danger/20">
              {error}
            </div>
          )}

          <form id="adjust-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
              >
                <option value="adjustment">Manual Adjustment (+/-)</option>
                <option value="wastage">Record Wastage (-)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Quantity {type === 'wastage' ? 'Lost' : 'Change'} ({item.unit})
              </label>
              <input
                type="number"
                required
                step="any"
                min={type === 'wastage' ? "0.01" : undefined}
                value={quantity || ''}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                placeholder={type === 'wastage' ? "e.g. 5" : "e.g. -5 or 10"}
              />
              {type === 'adjustment' && (
                <p className="text-xs text-muted">
                  Use negative values to reduce stock, positive to increase.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Reason / Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                placeholder="e.g. Spilled, Found extra, etc."
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="adjust-form"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
