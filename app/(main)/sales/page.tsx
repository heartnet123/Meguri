'use client';

import { useState, useMemo } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

type Transaction = {
  _id: string;
  displayId: string;
  createdAt: number;
  customer: string;
  itemCount: number;
  totalAmount: number;
  totalCost?: number;
  paymentMethod: 'cash' | 'credit_card' | 'mobile_pay' | 'invoice';
  status: 'completed' | 'pending' | 'refunded' | 'cancelled';
};

const PER_PAGE = 25;
const SKEL_WIDTHS = ['w-1/4', 'w-1/3', 'w-2/5', 'w-12', 'w-1/5', 'w-16', 'w-1/4', 'w-1/5', 'w-8'];

const PAYMENT_LABELS: Record<Transaction['paymentMethod'], string> = {
  cash: 'เงินสด',
  credit_card: 'บัตรเครดิต',
  mobile_pay: 'ชำระผ่านมือถือ',
  invoice: 'ใบแจ้งหนี้',
};

function SkeletonRow() {
  return (
    <tr aria-hidden="true" className="animate-pulse">
      {SKEL_WIDTHS.map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className={`h-4 bg-surface-raised rounded-lg ${w}`} />
        </td>
      ))}
    </tr>
  );
}

function StatSkeleton() {
  return <div className="h-7 w-24 bg-surface-raised rounded-lg animate-pulse" />;
}

function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', currencyDisplay: 'symbol' }).format(amount);
}

export default function SalesPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const args = (workspaceId && isAuthenticated) ? { workspaceId } : 'skip';
  const transactions = useQuery(api.sales.list, args) as Transaction[] | undefined;
  const todayStats = useQuery(api.sales.todayStats, args);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const isLoading = workspaceId !== undefined && transactions === undefined;

  const filtered = useMemo(() => {
    if (!transactions) return [];
    const s = search.toLowerCase();
    return transactions.filter((trx) => {
      if (s && !trx.displayId.toLowerCase().includes(s) && !trx.customer.toLowerCase().includes(s))
        return false;
      if (statusFilter && trx.status !== statusFilter) return false;
      return true;
    });
  }, [transactions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(1); };

  const isEmpty = !isLoading && (transactions ?? []).length === 0;
  const noResults = !isLoading && (transactions ?? []).length > 0 && filtered.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ทะเบียนการขาย</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">บันทึกรายการขายและการไหลของรายได้ทั้งหมดอย่างครบถ้วน</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/10 active:scale-[0.98]">
            <iconify-icon icon="solar:export-bold-duotone" width="18" height="18" aria-hidden="true" className="text-muted" />
            ส่งออกข้อมูลตรวจสอบ
          </button>
          <Link href="/sales/new" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]">
            <iconify-icon icon="solar:add-circle-bold-duotone" width="18" height="18" aria-hidden="true" />
            รายการขายใหม่
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-success/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success-subtle/50 flex items-center justify-center text-success border border-success/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:wallet-money-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">รายได้รวม</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {todayStats === undefined ? <StatSkeleton /> : formatCurrency(todayStats.revenue)}
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:chart-2-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">กำไรขั้นต้น</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {todayStats === undefined ? <StatSkeleton /> : (
              <span className={todayStats.marginPct >= 30 ? 'text-emerald-600' : todayStats.marginPct >= 15 ? 'text-amber-600' : 'text-red-600'}>
                {formatCurrency(todayStats.margin)} <span className="text-lg font-semibold text-muted">({todayStats.marginPct}%)</span>
              </span>
            )}
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-accent/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle/50 flex items-center justify-center text-accent border border-accent/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:cart-large-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">ออเดอร์ทั้งหมด</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums text-foreground">
            {todayStats === undefined ? <StatSkeleton /> : todayStats.orderCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-indigo-500/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:graph-up-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">มูลค่าเฉลี่ยต่อบิล</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums text-foreground">
            {todayStats === undefined ? <StatSkeleton /> : formatCurrency(todayStats.avgOrder)}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-raised/30">
          <div className="relative max-w-md w-full">
            <iconify-icon
              icon="solar:magnifer-linear" width="18" height="18"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="กรองด้วยรหัส ลูกค้า หรือข้อมูลอ้างอิง…"
              aria-label="ค้นหารายการขาย"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-muted/40 text-foreground"
            />
          </div>
          <select
            aria-label="กรองตามสถานะ"
            value={statusFilter}
            onChange={(e) => handleStatus(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
          >
            <option value="">ทุกสถานะ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="refunded">คืนเงินแล้ว</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">ตารางรายการขายสำหรับตรวจสอบธุรกรรมเชิงพาณิชย์</caption>
            <thead className="text-[10px] text-muted/60 font-bold uppercase tracking-widest bg-surface-raised/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4">รหัสอ้างอิง</th>
                <th scope="col" className="px-6 py-4">เวลา</th>
                <th scope="col" className="px-6 py-4">ลูกค้า</th>
                <th scope="col" className="px-6 py-4 text-right">จำนวนสินค้า</th>
                <th scope="col" className="px-6 py-4 text-right">ยอดชำระ</th>
                <th scope="col" className="px-6 py-4 text-right">กำไร</th>
                <th scope="col" className="px-6 py-4 text-center">ช่องทาง</th>
                <th scope="col" className="px-6 py-4 text-center">สถานะ</th>
                <th scope="col" className="px-6 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <tr>
                  <td colSpan={9} className="px-6 py-24 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-surface-raised flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                      <iconify-icon icon="solar:cart-large-bold-duotone" width="40" height="40" className="text-muted/20" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-bold text-foreground">ยังไม่มีรายการขาย</p>
                    <p className="text-sm text-muted mt-2 leading-relaxed max-w-xs mx-auto">ตอนนี้ยังไม่มีข้อมูลการขายในระบบ เริ่มบันทึกรายการแรกได้เลย</p>
                    <Link href="/sales/new" className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:scale-105 active:scale-95">
                      <iconify-icon icon="solar:add-circle-bold-duotone" width="18" height="18" />
                      เพิ่มรายการขาย
                    </Link>
                  </td>
                </tr>
              ) : noResults ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted/40 text-muted/60">
                      ไม่พบรายการที่ตรงกับเงื่อนไขค้นหา
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((trx) => (
                  <tr key={trx._id} className="hover:bg-accent-subtle/5 transition-colors group">
                    <td className="px-6 py-5 font-mono text-[10px] text-foreground font-black tracking-widest whitespace-nowrap">
                      <span className="text-accent/60">#</span>{trx.displayId}
                    </td>
                    <td className="px-6 py-5 text-muted/60 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest">
                      <time dateTime={new Date(trx.createdAt).toISOString()}>
                        {formatDateTime(trx.createdAt)}
                      </time>
                    </td>
                    <td className="px-6 py-5 max-w-[180px]">
                      <span className="block font-bold text-foreground truncate group-hover:text-accent transition-colors" title={trx.customer}>
                        {trx.customer || 'ลูกค้าทั่วไป'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-muted tabular-nums font-black text-xs">{trx.itemCount}</td>
                    <td className="px-6 py-5 text-right font-black text-foreground tabular-nums whitespace-nowrap tracking-tight text-sm">
                      {formatCurrency(trx.totalAmount)}
                    </td>
                    <td className="px-6 py-5 text-right tabular-nums whitespace-nowrap text-xs">
                      {trx.totalCost != null && trx.totalAmount > 0 ? (() => {
                        const marginPct = Math.round(((trx.totalAmount - trx.totalCost) / trx.totalAmount) * 100);
                        return (
                          <span className={`font-bold ${marginPct >= 30 ? 'text-emerald-600' : marginPct >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                            {marginPct}%
                          </span>
                        );
                      })() : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center text-muted/60 whitespace-nowrap text-[10px] font-black uppercase tracking-widest">
                      {PAYMENT_LABELS[trx.paymentMethod] ?? trx.paymentMethod}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border ${
                        trx.status === 'completed' ? 'bg-success-subtle/50 text-success border-success/10' :
                        trx.status === 'pending' ? 'bg-warning-subtle/50 text-warning border-warning/10' :
                        trx.status === 'refunded' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-surface-raised text-muted/40 border-border/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 shadow-sm ${
                          trx.status === 'completed' ? 'bg-success' : trx.status === 'pending' ? 'bg-warning' : trx.status === 'refunded' ? 'bg-blue-500' : 'bg-muted/30'
                        }`} />
                        {trx.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="w-9 h-9 flex items-center justify-center text-muted hover:text-accent hover:bg-accent-subtle/30 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-accent/10 active:scale-[0.9] border border-transparent hover:border-accent/10"
                        aria-label={`จัดการรายการ ${trx.displayId}`}
                      >
                        <iconify-icon icon="solar:menu-dots-bold-duotone" width="22" height="22" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-border flex items-center justify-between text-sm bg-surface-raised/30">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted/40">
            {isLoading
              ? <div className="h-4 w-48 bg-surface-raised rounded-lg animate-pulse" />
              : <>แสดงรายการ <span className="text-foreground/60">{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}</span>–<span className="text-foreground/60">{Math.min(page * PER_PAGE, filtered.length)}</span> จาก <span className="text-foreground/60">{filtered.length.toLocaleString('th-TH')}</span> รายการ</>
            }
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center text-muted border border-border rounded-xl hover:bg-surface-raised transition-all disabled:opacity-20 active:scale-[0.95]"
                  aria-label="หน้าก่อนหน้า"
                >
                  <iconify-icon icon="solar:alt-arrow-left-linear" width="18" height="18" />
                </button>
                <div className="flex items-center px-4 text-[10px] font-black uppercase tracking-widest text-muted/60">
                  หน้า {page} จาก {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center text-muted border border-border rounded-xl hover:bg-surface-raised transition-all disabled:opacity-20 active:scale-[0.95]"
                  aria-label="หน้าถัดไป"
                >
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" />
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
