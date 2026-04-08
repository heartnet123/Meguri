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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <iconify-icon icon="solar:trash-bin-trash-bold" width="24" height="24" className="text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 text-center mb-2">
            Archive Item
          </h2>
          <p className="text-sm text-neutral-500 text-center">
            Are you sure you want to archive <strong>{item.name}</strong>? This action cannot be undone.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}
