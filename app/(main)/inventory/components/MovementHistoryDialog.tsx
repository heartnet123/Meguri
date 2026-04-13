import { useQuery } from 'convex/react';
// @ts-ignore
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  inventoryItemId?: string | null;
};

export function MovementHistoryDialog({ isOpen, onClose, workspaceId, inventoryItemId }: Props) {
  const movements = useQuery(
    // @ts-ignore
    api.stockMovements.list,
    isOpen && workspaceId ? {
      workspaceId: workspaceId as Id<"workspaces">,
      inventoryItemId: inventoryItemId ? (inventoryItemId as Id<"inventoryItems">) : undefined
    } : 'skip'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Stock Movement History
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" aria-hidden="true" />
          </button>
        </div>

        <div className="p-0 overflow-y-auto">
          {movements === undefined ? (
            <div className="p-8 text-center text-neutral-500">Loading history...</div>
          ) : movements.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No stock movements found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Date</th>
                  {!inventoryItemId && <th scope="col" className="px-6 py-3 font-medium">Item</th>}
                  <th scope="col" className="px-6 py-3 font-medium">Type</th>
                  <th scope="col" className="px-6 py-3 font-medium text-right">Qty</th>
                  <th scope="col" className="px-6 py-3 font-medium">User</th>
                  <th scope="col" className="px-6 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((m: any) => (
                  <tr key={m._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-3 text-neutral-900 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short', timeStyle: 'short'
                      })}
                    </td>
                    {!inventoryItemId && (
                      <td className="px-6 py-3 text-neutral-900 max-w-[120px] truncate" title={m.itemName}>
                        {m.itemName}
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        m.type === 'delivery' ? 'bg-emerald-50 text-emerald-700' :
                        m.type === 'sale' ? 'bg-blue-50 text-blue-700' :
                        m.type === 'wastage' ? 'bg-red-50 text-red-700' :
                        m.type === 'adjustment' ? 'bg-amber-50 text-amber-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-medium whitespace-nowrap ${
                      m.quantity > 0 ? 'text-emerald-600' : m.quantity < 0 ? 'text-red-600' : 'text-neutral-900'
                    }`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="px-6 py-3 text-neutral-600 max-w-[100px] truncate" title={m.userName}>
                      {m.userName}
                    </td>
                    <td className="px-6 py-3 text-neutral-500 max-w-[150px] truncate" title={m.note}>
                      {m.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end bg-neutral-50 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
