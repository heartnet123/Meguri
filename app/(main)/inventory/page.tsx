'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import { InventoryItemDialog } from './components/InventoryItemDialog';
import { ArchiveItemDialog } from './components/ArchiveItemDialog';
import { AdjustStockDialog } from './components/AdjustStockDialog';
import { MovementHistoryDialog } from './components/MovementHistoryDialog';

type InventoryItem = {
  _id: Id<'inventoryItems'>;
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
          <div className={`h-4 bg-surface-raised rounded ${w}`} />
        </td>
      ))}
    </tr>
  );
}

function EmptyTableState({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
          <iconify-icon icon="solar:box-minimalistic-bold-duotone" width="32" height="32" className="text-muted/40 mx-auto" aria-hidden="true" />
        </div>
        <p className="text-base font-bold text-foreground">{message}</p>
        <p className="text-sm text-muted mt-1 leading-relaxed">เพิ่มรายการได้จากปุ่ม <strong>เพิ่มสินค้า</strong> ด้านบน</p>
      </td>
    </tr>
  );
}

export default function InventoryPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const searchParams = useSearchParams();
  const highlightedItemId = searchParams.get('highlight');
  const rawItems = useQuery(
    api.inventory.list,
    (workspaceId && isAuthenticated) ? { workspaceId } : 'skip'
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
  const [historyItemId, setHistoryItemId] = useState<Id<'inventoryItems'> | null>(null);

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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">สินค้าคงคลัง</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">จัดการวัตถุดิบและรายการสินค้าในสต็อก</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-surface border border-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => {
                setHistoryItemId(null);
                setIsHistoryDialogOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-surface-raised rounded-lg transition-all"
              title="ประวัติการเคลื่อนไหวทั้งหมด"
            >
              <iconify-icon icon="solar:history-bold-duotone" width="18" height="18" aria-hidden="true" className="text-muted" />
              ประวัติ
            </button>
            <div className="w-px bg-border my-1 mx-1" />
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-surface-raised rounded-lg transition-all">
              <iconify-icon icon="solar:export-bold-duotone" width="18" height="18" aria-hidden="true" className="text-muted" />
              ส่งออก
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedItem(null);
              setIsItemDialogOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
          >
            <iconify-icon icon="solar:add-circle-bold-duotone" width="18" height="18" aria-hidden="true" />
            เพิ่มสินค้า
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-raised/30">
          <div className="flex items-center gap-4 flex-wrap flex-1">
            <div className="relative max-w-xs w-full">
              <iconify-icon
                icon="solar:magnifer-linear"
                width="18" height="18"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ค้นหาสินค้า, SKU…"
                aria-label="ค้นหาสินค้าในคลัง"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-muted/40 text-foreground"
              />
            </div>
            <select
              aria-label="กรองตามหมวดหมู่"
              value={categoryFilter}
              onChange={(e) => handleCategory(e.target.value)}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors min-w-[160px]"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="กรองตามสถานะ"
              value={statusFilter}
              onChange={(e) => handleStatus(e.target.value)}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors min-w-[140px]"
            >
              <option value="">ทุกสถานะ</option>
              <option value="In Stock">มีสต็อก</option>
              <option value="Warning">สต็อกต่ำ</option>
              <option value="Critical">วิกฤต</option>
            </select>
          </div>
          {!isLoading && rawItems && (
            <div className="px-3 py-1 bg-surface-raised border border-border rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                พบ {filtered.length.toLocaleString()} รายการ
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">รายการสินค้าคงคลังแสดงระดับสต็อกและสถานะ</caption>
            <thead className="text-[10px] text-muted font-bold uppercase tracking-widest bg-surface-raised/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4">ชื่อสินค้า</th>
                <th scope="col" className="px-6 py-4">SKU</th>
                <th scope="col" className="px-6 py-4">หมวดหมู่</th>
                <th scope="col" className="px-6 py-4 text-right">สต็อกปัจจุบัน</th>
                <th scope="col" className="px-6 py-4 text-right">สต็อกขั้นต่ำ</th>
                <th scope="col" className="px-6 py-4 text-center">สถานะ</th>
                <th scope="col" className="px-6 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <EmptyTableState cols={7} message="ยังไม่มีรายการสินค้าคงคลัง" />
              ) : noResults ? (
                <EmptyTableState cols={7} message="ไม่พบรายการที่ตรงกับตัวกรอง" />
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

        <div className="p-5 border-t border-border flex items-center justify-between text-sm bg-surface-raised/30">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60">
            {isLoading
              ? <div className="h-4 w-40 bg-surface-raised rounded animate-pulse" />
              : <>แสดง <span className="text-foreground">{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}</span>–<span className="text-foreground">{Math.min(page * PER_PAGE, filtered.length)}</span> จาก <span className="text-foreground">{filtered.length.toLocaleString()}</span> รายการ</>
            }
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="หน้าก่อนหน้า"
                  className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted border border-border rounded-lg hover:bg-surface-raised transition-all disabled:opacity-30"
                >
                  ก่อนหน้า
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      aria-label={`หน้า ${p}`}
                      aria-current={page === p ? 'page' : undefined}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                        page === p 
                          ? 'bg-accent text-white shadow-md shadow-accent/20' 
                          : 'text-muted hover:bg-surface-raised border border-transparent hover:border-border'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="หน้าถัดไป"
                  className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted border border-border rounded-lg hover:bg-surface-raised transition-all disabled:opacity-30"
                >
                  ถัดไป
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
        workspaceId={workspaceId ?? undefined}
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
    <tr className={`transition-all group ${isHighlighted ? 'bg-accent-subtle/20 border-l-2 border-l-accent' : 'hover:bg-accent-subtle/5'}`}>
      <td className="px-6 py-5 min-w-0 max-w-[220px]">
        <span className="block font-bold text-foreground truncate group-hover:text-accent transition-colors" title={item.name}>{item.name || '(ไม่มีชื่อ)'}</span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted/50 mt-1">{item.sku}</span>
      </td>
      <td className="px-6 py-5 text-muted font-mono text-[10px] tracking-tight whitespace-nowrap">
        <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">{item.sku}</span>
      </td>
      <td className="px-6 py-5 text-muted max-w-[140px] text-xs font-medium">
        <span className="block truncate" title={item.category}>{item.category}</span>
      </td>
      <td className="px-6 py-5 text-right font-bold text-foreground tabular-nums whitespace-nowrap tracking-tight">
        {item.currentStock.toLocaleString()} <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60 ml-0.5">{item.unit}</span>
      </td>
      <td className="px-6 py-5 text-right text-muted tabular-nums whitespace-nowrap font-medium text-xs">
        {item.minStockLevel.toLocaleString()} <span className="text-[10px] font-medium text-muted/40 ml-0.5">{item.unit}</span>
      </td>
      <td className="px-6 py-5 text-center">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border ${
            isCritical
              ? 'bg-danger-subtle/50 text-danger border-danger/20'
              : isWarning
              ? 'bg-warning-subtle/50 text-warning border-warning/20'
              : 'bg-success-subtle/50 text-success border-success/20'
          }`}
        >
          <span className={`w-1 h-1 rounded-full mr-1.5 ${
            isCritical ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'
          }`} />
          {item.status === 'Warning' ? 'สต็อกต่ำ' : item.status === 'Critical' ? 'วิกฤต' : 'มีสต็อก'}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
          <button
            onClick={onHistory}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-accent hover:bg-accent-subtle/30 rounded-lg transition-all focus:outline-none"
            aria-label={`ประวัติของ ${item.name}`}
            title="ประวัติการเคลื่อนไหว"
          >
            <iconify-icon icon="solar:history-bold-duotone" width="18" height="18" aria-hidden="true" />
          </button>
          <button
            onClick={onAdjust}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-accent hover:bg-accent-subtle/30 rounded-lg transition-all focus:outline-none"
            aria-label={`ปรับสต็อกของ ${item.name}`}
            title="ปรับสต็อก"
          >
            <iconify-icon icon="solar:calculator-minimalistic-bold-duotone" width="18" height="18" aria-hidden="true" />
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-accent hover:bg-accent-subtle/30 rounded-lg transition-all focus:outline-none"
            aria-label={`แก้ไข ${item.name}`}
            title="แก้ไขสินค้า"
          >
            <iconify-icon icon="solar:pen-bold-duotone" width="18" height="18" aria-hidden="true" />
          </button>
          <button
            onClick={onArchive}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-danger hover:bg-danger-subtle/30 rounded-lg transition-all focus:outline-none"
            aria-label={`เก็บ ${item.name} เป็นคลังเก่า`}
            title="เก็บเข้าคลังเก่า"
          >
            <iconify-icon icon="solar:trash-bin-trash-bold-duotone" width="18" height="18" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
