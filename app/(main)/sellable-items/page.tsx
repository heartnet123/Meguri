'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

type SellableItemRow = {
  _id: Id<'sellableItems'>;
  displayId: string;
  name: string;
  sku: string;
  purchaseCost: number;
  salePrice: number;
  profit: number;
  marginPct: number;
  trackStock: boolean;
  currentStock: number;
  minStockLevel: number;
  isActive: boolean;
  notes?: string;
};

type SellableSummary = {
  totalItems: number;
  activeItems: number;
  avgMargin: number;
  totalValue: number;
};

type SellableItemFormState = {
  name: string;
  sku: string;
  purchaseCost: string;
  salePrice: string;
  currentStock: string;
  minStockLevel: string;
  trackStock: boolean;
  notes: string;
};

export default function SellableItemsPage() {
  const workspaceId = useWorkspaceId();
  const sellableItems = useQuery(api.sellableItems.list, workspaceId ? { workspaceId } : 'skip') as SellableItemRow[] | undefined;
  const summary = useQuery(api.sellableItems.summary, workspaceId ? { workspaceId } : 'skip') as SellableSummary | undefined;
  const createItem = useMutation(api.sellableItems.create);
  const updateItem = useMutation(api.sellableItems.update);
  const removeItem = useMutation(api.sellableItems.remove);

  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<SellableItemRow | null>(null);
  const [form, setForm] = useState<SellableItemFormState>({
    name: '', sku: '', purchaseCost: '', salePrice: '', currentStock: '0', minStockLevel: '0', trackStock: true, notes: '',
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return (sellableItems ?? []).filter((item) =>
      !s || item.name.toLowerCase().includes(s) || item.sku.toLowerCase().includes(s) || item.displayId.toLowerCase().includes(s)
    );
  }, [sellableItems, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sku: '', purchaseCost: '', salePrice: '', currentStock: '0', minStockLevel: '0', trackStock: true, notes: '' });
    setIsOpen(true);
  };

  const openEdit = (item: SellableItemRow) => {
    setEditing(item);
    setForm({
      name: item.name,
      sku: item.sku,
      purchaseCost: String(item.purchaseCost),
      salePrice: String(item.salePrice),
      currentStock: String(item.currentStock ?? 0),
      minStockLevel: String(item.minStockLevel ?? 0),
      trackStock: !!item.trackStock,
      notes: item.notes ?? '',
    });
    setIsOpen(true);
  };

  const submit = async () => {
    if (!workspaceId) return;
    const createPayload = {
      workspaceId,
      displayId: editing?.displayId ?? `SIT-${Date.now().toString().slice(-5)}`,
      name: form.name,
      sku: form.sku,
      purchaseCost: Number(form.purchaseCost || 0),
      salePrice: Number(form.salePrice || 0),
      trackStock: form.trackStock,
      currentStock: Number(form.currentStock || 0),
      minStockLevel: Number(form.minStockLevel || 0),
      notes: form.notes || undefined,
    };

    if (editing) {
      await updateItem({
        sellableItemId: editing._id,
        name: createPayload.name,
        sku: createPayload.sku,
        purchaseCost: createPayload.purchaseCost,
        salePrice: createPayload.salePrice,
        trackStock: createPayload.trackStock,
        currentStock: createPayload.currentStock,
        minStockLevel: createPayload.minStockLevel,
        notes: createPayload.notes,
      });
    } else {
      await createItem(createPayload);
    }

    setIsOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">สินค้าพร้อมขาย</h1>
          <p className="mt-1 text-sm text-muted">สินค้าสำหรับขายต่อพร้อมข้อมูลราคา กำไร และตรรกะสต็อก</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90">
          เพิ่มสินค้า
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Metric label="สินค้าทั้งหมด" value={summary?.totalItems ?? 0} />
        <Metric label="สินค้าที่ใช้งานอยู่" value={summary?.activeItems ?? 0} />
        <Metric label="กำไรเฉลี่ย" value={`${summary?.avgMargin ?? 0}%`} accent />
        <Metric label="มูลค่าสต็อก" value={formatCurrency(summary?.totalValue ?? 0)} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="relative">
          <iconify-icon
            icon="solar:magnifer-linear"
            width="18" height="18"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="ค้นหาสินค้า"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ SKU หรือรหัสสินค้า"
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-raised">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">สินค้า</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">ต้นทุน</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">ราคาขาย</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">กำไร</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">สต็อก</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr><td className="px-6 py-10 text-center text-sm text-muted" colSpan={6}>ไม่พบสินค้าพร้อมขาย</td></tr>
            ) : filtered.map((item) => {
              const profit = item.profit ?? (item.salePrice - item.purchaseCost);
              const marginPct = item.marginPct ?? (item.salePrice > 0 ? Math.round((profit / item.salePrice) * 100) : 0);
              return (
                <tr key={item._id} className="hover:bg-surface-raised/40">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted">{item.displayId} · {item.sku}</div>
                  </td>
                  <td className="px-6 py-4 tabular-nums">{formatCurrency(item.purchaseCost)}</td>
                  <td className="px-6 py-4 tabular-nums">{formatCurrency(item.salePrice)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-success tabular-nums">{formatCurrency(profit)}</div>
                    <div className="text-xs text-muted">มาร์จิ้น {marginPct}%</div>
                  </td>
                  <td className="px-6 py-4 tabular-nums">{item.trackStock ? (item.currentStock ?? 0) : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-raised">แก้ไข</button>
                      <button onClick={() => removeItem({ sellableItemId: item._id })} className="rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-subtle">ลบ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
                <p className="text-sm text-muted">ต้นทุน ราคาขาย และกำไรจะคำนวณตามกฎธุรกิจอัตโนมัติ</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-xl px-3 py-2 text-sm hover:bg-surface-raised">ปิด</button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="ชื่อสินค้า" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
              <Field label="SKU" value={form.sku} onChange={(v) => setForm((f) => ({ ...f, sku: v }))} />
              <Field label="ต้นทุนซื้อ" type="number" value={form.purchaseCost} onChange={(v) => setForm((f) => ({ ...f, purchaseCost: v }))} />
              <Field label="ราคาขาย" type="number" value={form.salePrice} onChange={(v) => setForm((f) => ({ ...f, salePrice: v }))} />
              <Field label="สต็อกปัจจุบัน" type="number" value={form.currentStock} onChange={(v) => setForm((f) => ({ ...f, currentStock: v }))} />
              <Field label="ระดับสต็อกขั้นต่ำ" type="number" value={form.minStockLevel} onChange={(v) => setForm((f) => ({ ...f, minStockLevel: v }))} />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted">ตัวอย่างกำไรแบบเรียลไทม์</div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <Preview label="ต้นทุน" value={formatCurrency(Number(form.purchaseCost || 0))} />
                <Preview label="กำไร" value={formatCurrency(Number(form.salePrice || 0) - Number(form.purchaseCost || 0))} accent />
                <Preview label="มาร์จิ้น" value={`${Number(form.salePrice || 0) > 0 ? Math.round(((Number(form.salePrice || 0) - Number(form.purchaseCost || 0)) / Number(form.salePrice || 0)) * 100) : 0}%`} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.trackStock} onChange={(e) => setForm((f) => ({ ...f, trackStock: e.target.checked }))} />
                ติดตามสต็อก
              </label>
              <div className="flex gap-2">
                <button onClick={() => setIsOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm">ยกเลิก</button>
                <button onClick={submit} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">{editing ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างสินค้า'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><div className="text-xs font-medium uppercase tracking-widest text-muted">{label}</div><div className={`mt-2 text-2xl font-bold ${accent ? 'text-success' : 'text-foreground'}`}>{value}</div></div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string; }) {
  return <label className="space-y-1.5 text-sm"><span className="font-medium text-foreground">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent" /></label>;
}

function Preview({ label, value, accent = false }: { label: string; value: string; accent?: boolean; }) {
  return <div className="rounded-xl border border-border bg-surface p-3"><div className="text-xs text-muted">{label}</div><div className={`mt-1 font-semibold ${accent ? 'text-success' : 'text-foreground'}`}>{value}</div></div>;
}
