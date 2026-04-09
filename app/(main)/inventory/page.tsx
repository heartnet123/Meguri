'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import { InventoryItemDialog } from './components/InventoryItemDialog';
import { ArchiveItemDialog } from './components/ArchiveItemDialog';
import { AdjustStockDialog } from './components/AdjustStockDialog';
import { MovementHistoryDialog } from './components/MovementHistoryDialog';

type InventoryItem = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  status: 'Critical' | 'Warning' | 'In Stock';
};

const PER_PAGE = 20;
const SKEL_WIDTHS = ['w-2/3', 'w-1/3', 'w-1/2', 'w-1/4', 'w-1/4', 'w-1/3', 'w-8'];

function SkeletonRow() {
  return (
    <tr aria-hidden="true" className="animate-pulse">
      {SKEL_WIDTHS.map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className={`h-4 bg-neutral-100 rounded ${w}`} />
        </td>
      ))}
    </tr>
  );
}

function EmptyTableState({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-20 text-center">
        <iconify-icon icon="solar:box-minimalistic-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
        <p className="text-sm font-medium text-neutral-700">{message}</p>
        <p className="text-xs text-neutral-500 mt-1">Add items using the button above.</p>
      </td>
    </tr>
  );
}

export default function InventoryPage() {
  const workspaceId = useWorkspaceId();
  const searchParams = useSearchParams();
  const highlightedItemId = searchParams.get('highlight');
  const rawItems = useQuery(
    api.inventory.list,
    workspaceId ? { workspaceId } : 'skip'
  ) as InventoryItem[] | undefined;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Dialog state
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<InventoryItem | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  const isLoading = workspaceId !== undefined && rawItems === undefined;

  const categories = useMemo(
    () => [...new Set(rawItems?.map((i) => i.category) ?? [])].sort(),
    [rawItems]
  );

  const filtered = useMemo(() => {
    if (!rawItems) return [];
    const s = search.toLowerCase();
    return rawItems.filter((item) => {
      if (s && !item.name.toLowerCase().includes(s) && !item.sku.toLowerCase().includes(s))
        return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [rawItems, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCategory = (v: string) => { setCategoryFilter(v); setPage(1); };
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(1); };

  const isEmpty = !isLoading && (rawItems ?? []).length === 0;
  const noResults = !isLoading && (rawItems ?? []).length > 0 && filtered.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Inventory</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your raw materials and stock items.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setHistoryItemId(null);
              setIsHistoryDialogOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <iconify-icon icon="solar:history-linear" width="18" height="18" aria-hidden="true" />
            History
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <iconify-icon icon="solar:export-linear" width="18" height="18" aria-hidden="true" />
            Export
          </button>
          <button
            onClick={() => {
              setSelectedItem(null);
              setIsItemDialogOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18" aria-hidden="true" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <iconify-icon
                icon="solar:magnifer-linear"
                width="18" height="18"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search items, SKU…"
                aria-label="Search inventory items"
                className="pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:border-neutral-900 transition-all w-56"
              />
            </div>
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => handleCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => handleStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Warning">Low Stock</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          {!isLoading && rawItems && (
            <span className="text-xs text-neutral-500 shrink-0">
              {filtered.length.toLocaleString()} item{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Inventory items list showing stock levels and status</caption>
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Item Name</th>
                <th scope="col" className="px-6 py-3 font-medium">SKU</th>
                <th scope="col" className="px-6 py-3 font-medium">Category</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Current Stock</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Min. Stock Level</th>
                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <EmptyTableState cols={7} message="No inventory items yet" />
              ) : noResults ? (
                <EmptyTableState cols={7} message="No items match your filters" />
              ) : (
                pageItems.map((item) => (
                  <InventoryRow
                    key={item._id}
                    item={item}
                    isHighlighted={highlightedItemId === item._id}
                    onEdit={() => {
                      setSelectedItem(item);
                      setIsItemDialogOpen(true);
                    }}
                    onArchive={() => {
                      setItemToArchive(item);
                      setIsArchiveDialogOpen(true);
                    }}
                    onAdjust={() => {
                      setItemToAdjust(item);
                      setIsAdjustDialogOpen(true);
                    }}
                    onHistory={() => {
                      setHistoryItemId(item._id);
                      setIsHistoryDialogOpen(true);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-sm text-neutral-500 bg-neutral-50/50">
          <div>
            {isLoading
              ? <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
              : `Showing ${Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length.toLocaleString()} items`
            }
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                    className={`px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${page === p ? 'bg-white font-medium text-neutral-900' : ''}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>

      <InventoryItemDialog
        isOpen={isItemDialogOpen}
        onClose={() => setIsItemDialogOpen(false)}
        item={selectedItem}
      />

      <ArchiveItemDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        item={itemToArchive}
      />

      <AdjustStockDialog
        isOpen={isAdjustDialogOpen}
        onClose={() => setIsAdjustDialogOpen(false)}
        item={itemToAdjust}
      />

      <MovementHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        workspaceId={workspaceId}
        inventoryItemId={historyItemId}
      />
    </div>
  );
}

function InventoryRow({
  item,
  isHighlighted = false,
  onEdit,
  onArchive,
  onAdjust,
  onHistory,
}: {
  item: InventoryItem;
  isHighlighted?: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onAdjust: () => void;
  onHistory: () => void;
}) {
  const isCritical = item.status === 'Critical';
  const isWarning = item.status === 'Warning';

  return (
    <tr className={`transition-colors ${isHighlighted ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-neutral-50/50'}`}>
      <td className="px-6 py-4 font-medium text-neutral-900 max-w-[220px]">
        <span className="block truncate" title={item.name}>{item.name || '(unnamed)'}</span>
      </td>
      <td className="px-6 py-4 text-neutral-600 font-mono text-xs whitespace-nowrap">{item.sku}</td>
      <td className="px-6 py-4 text-neutral-600 max-w-[140px]">
        <span className="block truncate" title={item.category}>{item.category}</span>
      </td>
      <td className="px-6 py-4 text-right font-medium text-neutral-900 whitespace-nowrap">
        {item.currentStock.toLocaleString()} <span className="text-neutral-500 font-normal">{item.unit}</span>
      </td>
      <td className="px-6 py-4 text-right text-neutral-500 whitespace-nowrap">
        {item.minStockLevel.toLocaleString()} <span className="text-neutral-400">{item.unit}</span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
            isCritical
              ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
              : isWarning
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
          }`}
        >
          {item.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onHistory}
            className="p-1.5 text-neutral-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label={`History for ${item.name}`}
            title="Movement History"
          >
            <iconify-icon icon="solar:history-linear" width="18" height="18" aria-hidden="true" />
          </button>
          <button
            onClick={onAdjust}
            className="p-1.5 text-neutral-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={`Adjust stock for ${item.name}`}
            title="Adjust Stock"
          >
            <iconify-icon icon="solar:calculator-minimalistic-linear" width="18" height="18" aria-hidden="true" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-neutral-400 hover:text-teal-600 rounded-md hover:bg-teal-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label={`Edit ${item.name}`}
            title="Edit Item"
          >
            <iconify-icon icon="solar:pen-linear" width="18" height="18" aria-hidden="true" />
          </button>
          <button
            onClick={onArchive}
            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            aria-label={`Archive ${item.name}`}
            title="Archive Item"
          >
            <iconify-icon icon="solar:trash-bin-trash-linear" width="18" height="18" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
