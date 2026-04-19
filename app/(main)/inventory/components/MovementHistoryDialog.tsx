import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type StockMovementRow = {
  _id: Id<'stockMovements'>;
  createdAt: number;
  quantity: number;
  type: 'delivery' | 'sale' | 'adjustment' | 'wastage' | 'transfer' | 'initial_stock' | 'archive';
  note?: string;
  itemName: string;
  userName: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: Id<'workspaces'>;
  inventoryItemId?: Id<'inventoryItems'> | null;
};

export function MovementHistoryDialog({ isOpen, onClose, workspaceId, inventoryItemId }: Props) {
  const movements = useQuery(
    api.stockMovements.list,
    isOpen && workspaceId ? {
      workspaceId,
      inventoryItemId: inventoryItemId ?? undefined,
    } : 'skip'
  ) as StockMovementRow[] | undefined;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl border border-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
          <h2 className="text-lg font-semibold text-foreground">
            Stock Movement History
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface-raised"
            aria-label="Close dialog"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" aria-hidden="true" />
          </button>
        </div>

        <div className="p-0 overflow-y-auto">
          {movements === undefined ? (
            <div className="p-12 text-center">
               <iconify-icon icon="solar:refresh-circle-linear" width="32" height="32" className="animate-spin text-accent mx-auto mb-3 block" />
               <p className="text-sm font-medium text-muted">Loading history...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center">
               <iconify-icon icon="solar:history-linear" width="32" height="32" className="text-muted/30 mx-auto mb-3 block" />
               <p className="text-sm font-medium text-muted">No stock movements found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted uppercase bg-surface-raised border-b border-border sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Date</th>
                  {!inventoryItemId && <th scope="col" className="px-6 py-3 font-medium">Item</th>}
                  <th scope="col" className="px-6 py-3 font-medium">Type</th>
                  <th scope="col" className="px-6 py-3 font-medium text-right">Qty</th>
                  <th scope="col" className="px-6 py-3 font-medium">User</th>
                  <th scope="col" className="px-6 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {movements.map((m) => (
                  <tr key={m._id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-6 py-3 text-foreground whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short', timeStyle: 'short'
                      })}
                    </td>
                    {!inventoryItemId && (
                      <td className="px-6 py-3 text-foreground max-w-[120px] truncate font-medium" title={m.itemName}>
                        {m.itemName}
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        m.type === 'delivery' ? 'bg-success-subtle text-success' :
                        m.type === 'sale' ? 'bg-accent-subtle text-accent' :
                        m.type === 'wastage' ? 'bg-danger-subtle text-danger' :
                        m.type === 'adjustment' ? 'bg-warning-subtle text-warning' :
                        'bg-surface-raised text-muted'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-medium whitespace-nowrap ${
                      m.quantity > 0 ? 'text-success' : m.quantity < 0 ? 'text-danger' : 'text-foreground'
                    }`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="px-6 py-3 text-muted max-w-[100px] truncate" title={m.userName}>
                      {m.userName}
                    </td>
                    <td className="px-6 py-3 text-muted max-w-[150px] truncate" title={m.note}>
                      {m.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end bg-subtle mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
