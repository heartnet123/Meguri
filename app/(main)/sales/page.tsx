import type { Id } from "@/convex/_generated/dataModel";
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

type Transaction = {
  _id: string;
  displayId: string;
  createdAt: number;
  customer: string;
  itemCount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit_card' | 'mobile_pay' | 'invoice';
  status: 'completed' | 'pending' | 'refunded' | 'cancelled';
};

const PER_PAGE = 25;
const SKEL_WIDTHS = ['w-1/4', 'w-1/3', 'w-2/5', 'w-12', 'w-1/5', 'w-1/4', 'w-1/5', 'w-8'];

const PAYMENT_LABELS: Record<Transaction['paymentMethod'], string> = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  mobile_pay: 'Mobile Pay',
  invoice: 'Invoice',
};

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

function StatSkeleton() {
  return <div className="h-7 w-24 bg-neutral-100 rounded animate-pulse" />;
}

function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function SalesPage() {
  const workspaceId = useWorkspaceId();
  const transactions = useQuery(
    api.sales.list,
    workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  ) as Transaction[] | undefined;
  const todayStats = useQuery(
    api.sales.todayStats,
    workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  );

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Sales &amp; Transactions</h1>
          <p className="text-sm text-neutral-500 mt-1">Track your daily sales, orders, and revenue performance.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <iconify-icon icon="solar:export-linear" width="18" height="18" aria-hidden="true" />
            Export Report
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18" aria-hidden="true" />
            New Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600" aria-hidden="true">
              <iconify-icon icon="solar:wallet-money-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Today&apos;s Revenue</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900 tabular-nums">
            {todayStats === undefined ? <StatSkeleton /> : formatCurrency(todayStats.revenue)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600" aria-hidden="true">
              <iconify-icon icon="solar:cart-large-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Orders Today</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900 tabular-nums">
            {todayStats === undefined ? <StatSkeleton /> : todayStats.orderCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600" aria-hidden="true">
              <iconify-icon icon="solar:graph-up-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Average Order Value</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900 tabular-nums">
            {todayStats === undefined ? <StatSkeleton /> : formatCurrency(todayStats.avgOrder)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
          <div className="relative max-w-md w-full">
            <iconify-icon
              icon="solar:magnifer-linear" width="18" height="18"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search transactions, customers…"
              aria-label="Search transactions"
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:border-neutral-900 transition-all bg-white"
            />
          </div>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => handleStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Sales transactions list</caption>
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Transaction ID</th>
                <th scope="col" className="px-6 py-3 font-medium">Date &amp; Time</th>
                <th scope="col" className="px-6 py-3 font-medium">Customer</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Items</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Total</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Payment</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <iconify-icon icon="solar:cart-large-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
                    <p className="text-sm font-medium text-neutral-700">No transactions yet</p>
                    <p className="text-xs text-neutral-500 mt-1">Record your first sale to get started.</p>
                  </td>
                </tr>
              ) : noResults ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-neutral-500">
                    No transactions match your search.
                  </td>
                </tr>
              ) : (
                pageItems.map((trx) => (
                  <tr key={trx._id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-neutral-900 font-medium whitespace-nowrap">{trx.displayId}</td>
                    <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                      <time dateTime={new Date(trx.createdAt).toISOString()}>
                        {formatDateTime(trx.createdAt)}
                      </time>
                    </td>
                    <td className="px-6 py-4 max-w-[180px]">
                      <span className="block font-medium text-neutral-900 truncate" title={trx.customer}>
                        {trx.customer || 'Walk-in Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-600 tabular-nums">{trx.itemCount}</td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(trx.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-600 whitespace-nowrap">
                      {PAYMENT_LABELS[trx.paymentMethod] ?? trx.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                        trx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                        trx.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                        trx.status === 'refunded' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' :
                        'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-600/20'
                      }`}>
                        {trx.status.charAt(0).toUpperCase() + trx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                        aria-label={`Actions for transaction ${trx.displayId}`}
                      >
                        <iconify-icon icon="solar:menu-dots-bold" width="20" height="20" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-sm text-neutral-500 bg-neutral-50/50">
          <div>
            {isLoading
              ? <div className="h-4 w-48 bg-neutral-100 rounded animate-pulse" />
              : `Showing ${Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length.toLocaleString()} transactions`
            }
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >Previous</button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >Next</button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
