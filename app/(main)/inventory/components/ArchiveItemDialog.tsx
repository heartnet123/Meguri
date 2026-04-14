import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Item = {
  _id: string;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
};

export function ArchiveItemDialog({ isOpen, onClose, item }: Props) {
  const remove = useMutation(api.inventory.remove);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleArchive = async () => {
    setLoading(true);
    setError(null);
    try {
      await remove({ id: item._id as Id<"inventoryItems"> });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl border border-border w-full max-w-sm overflow-hidden flex flex-col translate-y-[-10%] sm:translate-y-0">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-danger-subtle flex items-center justify-center mx-auto mb-4">
            <iconify-icon icon="solar:trash-bin-trash-bold" width="24" height="24" className="text-danger" />
          </div>
          <h2 className="text-lg font-semibold text-foreground text-center mb-2">
            Archive Item
          </h2>
          <p className="text-sm text-muted text-center leading-relaxed">
            Are you sure you want to archive <strong className="text-foreground">{item.name}</strong>? This action cannot be undone.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-danger-subtle text-danger text-sm rounded-lg border border-danger/20">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-1"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger/90 transition-colors disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
          >
            {loading ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}
