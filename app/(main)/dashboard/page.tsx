'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function StatSkeleton({ wide }: { wide?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`h-8 bg-neutral-100 rounded animate-pulse ${wide ? 'w-32' : 'w-16'}`}
    />
  );
}

function TextSkeleton({ className = 'w-24' }: { className?: string }) {
  return <div aria-hidden="true" className={`h-3.5 bg-neutral-100 rounded animate-pulse ${className}`} />;
}

// ─── Currency formatter ───────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  change,
  subtitle,
  positive,
  negative,
  icon,
  loading,
}: {
  title: string;
  value?: string | number;
  change?: string;
  subtitle?: string;
  positive?: boolean;
  negative?: boolean;
  icon: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-neutral-500 leading-snug pr-2">{title}</h3>
        <div className="p-2 rounded-lg bg-teal-50 text-teal-600 shrink-0" aria-hidden="true">
          <iconify-icon icon={icon} width="20" height="20" />
        </div>
      </div>
      <div className="text-2xl font-medium tracking-tight text-neutral-900 mb-1 tabular-nums">
        {loading ? <StatSkeleton wide /> : (value ?? '—')}
      </div>
      {loading ? (
        <TextSkeleton className="w-20 mt-1" />
      ) : change ? (
        <div
          className={`text-xs font-medium ${
            positive ? 'text-emerald-600' : negative ? 'text-red-600' : 'text-neutral-500'
          }`}
        >
          {change}
        </div>
      ) : subtitle ? (
        <div className="text-xs text-neutral-500">{subtitle}</div>
      ) : null}
    </div>
  );
}

// ─── Low Stock row ────────────────────────────────────────────────────────────

type LowStockItem = {
  _id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  status: 'Critical' | 'Warning';
};

function LowStockRow({ item }: { item: LowStockItem }) {
  const isCritical = item.status === 'Critical';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 last:pb-0 gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-neutral-900 truncate" title={item.name}>
          {item.name}
        </div>
        <div className="text-xs text-neutral-500">
          Min: {item.minStockLevel.toLocaleString()} {item.unit}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-sm font-medium tabular-nums ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
          {item.currentStock.toLocaleString()} {item.unit}
        </div>
        <div
          className={`text-xs font-medium px-1.5 py-0.5 rounded inline-block mt-1 ${
            isCritical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {item.status}
        </div>
      </div>
    </div>
  );
}

function LowStockSkeleton() {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 animate-pulse">
      <div className="space-y-1.5 flex-1 mr-4">
        <div className="h-4 bg-neutral-100 rounded w-3/4" />
        <div className="h-3 bg-neutral-100 rounded w-1/3" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="h-4 bg-neutral-100 rounded w-16" />
        <div className="h-4 bg-neutral-100 rounded w-12 ml-auto" />
      </div>
    </div>
  );
}

// ─── Recommendation card ──────────────────────────────────────────────────────

type Recommendation = {
  _id: string;
  itemName: string;
  supplierName: string;
  recommendedQty: number;
  reason: string;
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-900 truncate" title={rec.itemName}>
            {rec.itemName}
          </div>
          <div className="text-xs text-neutral-500 truncate" title={rec.supplierName}>
            from {rec.supplierName}
          </div>
        </div>
        <div className="text-sm font-medium text-neutral-900 bg-white px-2 py-1 rounded border border-neutral-200 shadow-sm shrink-0 tabular-nums">
          {rec.recommendedQty.toLocaleString()} units
        </div>
      </div>
      <div className="text-xs text-neutral-600 flex gap-1.5 items-start">
        <iconify-icon icon="solar:info-circle-linear" width="14" height="14" className="text-neutral-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span className="line-clamp-2">{rec.reason}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 bg-teal-600 text-white text-xs font-medium py-1.5 rounded-md hover:bg-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1">
          Accept &amp; Order
        </button>
        <button className="px-3 bg-white text-neutral-700 text-xs font-medium py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
          Edit
        </button>
      </div>
    </div>
  );
}

function RecSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-neutral-200 animate-pulse space-y-2">
      <div className="flex justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-neutral-100 rounded w-2/3" />
          <div className="h-3 bg-neutral-100 rounded w-1/3" />
        </div>
        <div className="h-8 w-16 bg-neutral-100 rounded" />
      </div>
      <div className="h-3 bg-neutral-100 rounded w-full" />
      <div className="h-3 bg-neutral-100 rounded w-3/4" />
      <div className="flex gap-2 mt-1">
        <div className="flex-1 h-7 bg-neutral-100 rounded-md" />
        <div className="w-14 h-7 bg-neutral-100 rounded-md" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { workspaceId, workspaceValidated } = useWorkspace();
  const args = workspaceId && workspaceValidated ? { workspaceId } : 'skip';

  const summary = useQuery(api.dashboard.summary, args);
  const lowStockItems = useQuery(api.dashboard.lowStockItems, args) as LowStockItem[] | undefined;
  const reorderRecs = useQuery(api.dashboard.reorderRecommendations, args) as Recommendation[] | undefined;
  const anomalies = useQuery(api.dashboard.anomalies, args);

  const isLoadingSummary = workspaceId !== undefined && summary === undefined;
  const isLoadingLowStock = workspaceId !== undefined && lowStockItems === undefined;
  const isLoadingRecs = workspaceId !== undefined && reorderRecs === undefined;
  const isLoadingAnomalies = workspaceId !== undefined && anomalies === undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Welcome back. Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <iconify-icon icon="solar:calendar-linear" width="18" height="18" aria-hidden="true" />
            Today
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18" aria-hidden="true" />
            Record Delivery
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sales Today"
          value={summary ? fmt(summary.todayRevenue) : undefined}
          change={summary ? `${summary.todayOrderCount} orders completed` : undefined}
          positive
          icon="solar:wallet-money-linear"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="Low Stock Items"
          value={summary?.lowStockCount}
          change={summary ? `${summary.criticalCount} critical` : undefined}
          negative={summary ? summary.criticalCount > 0 : undefined}
          icon="solar:danger-triangle-linear"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="AI Reorder Suggestions"
          value={summary?.pendingRecommendations}
          subtitle="Pending review"
          icon="solar:graph-up-linear"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="Open Alerts"
          value={summary?.openAlertCount}
          change={summary?.openAlertCount === 0 ? 'All clear' : undefined}
          positive={summary?.openAlertCount === 0}
          negative={summary ? summary.openAlertCount > 0 : undefined}
          icon="solar:shield-warning-linear"
          loading={isLoadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-neutral-900">Sales vs Forecast</h2>
            <select
              aria-label="Select time period"
              className="text-sm border-none bg-transparent text-neutral-500 focus:ring-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded"
            >
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-3 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-teal-600" aria-hidden="true" />
              <span>Actual Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-neutral-200" aria-hidden="true" />
              <span>Forecast</span>
            </div>
          </div>
          <div
            className="h-64 w-full relative flex items-end gap-2"
            role="img"
            aria-label="Bar chart placeholder — connect real sales data to populate."
          >
            {[40, 55, 45, 70, 65, 85, 90].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                <div className="w-full bg-neutral-100 rounded-t-sm" style={{ height: `${val}%` }}>
                  <div className="w-full bg-teal-600 rounded-t-sm" style={{ height: `${val * 0.8}%` }} />
                </div>
                <div className="text-xs text-center text-neutral-400 mt-2" aria-hidden="true">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Widget */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-neutral-900">Low Stock Alerts</h2>
            <Link
              href="/alerts"
              className="text-sm text-teal-600 hover:text-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded"
            >
              View All
            </Link>
          </div>
          <div className="flex-1 space-y-1" aria-live="polite" aria-busy={isLoadingLowStock}>
            {isLoadingLowStock ? (
              Array.from({ length: 3 }).map((_, i) => <LowStockSkeleton key={i} />)
            ) : (lowStockItems ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <iconify-icon icon="solar:check-circle-linear" width="28" height="28" className="text-emerald-400 mx-auto mb-2 block" aria-hidden="true" />
                <p className="text-sm text-neutral-500">All items are well stocked.</p>
              </div>
            ) : (
              lowStockItems!.map((item) => <LowStockRow key={item._id} item={item} />)
            )}
          </div>
          {!isLoadingLowStock && (lowStockItems ?? []).length > 0 && (
            <Link
              href="/purchase-planning"
              className="w-full mt-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 text-center block"
            >
              Place Reorders
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Reorder Recommendations */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base font-medium text-neutral-900 truncate">AI Reorder Recommendations</h2>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                AI
              </span>
            </div>
          </div>
          <div className="space-y-3" aria-live="polite" aria-busy={isLoadingRecs}>
            {isLoadingRecs ? (
              <><RecSkeleton /><RecSkeleton /></>
            ) : (reorderRecs ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <iconify-icon icon="solar:cart-large-linear" width="28" height="28" className="text-neutral-300 mx-auto mb-2 block" aria-hidden="true" />
                <p className="text-sm text-neutral-500">No pending recommendations.</p>
              </div>
            ) : (
              reorderRecs!.map((rec) => <RecommendationCard key={rec._id} rec={rec} />)
            )}
          </div>
        </div>

        {/* Anomalies */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-neutral-900">Anomalies Detected</h2>
            <Link
              href="/alerts"
              className="text-sm text-teal-600 hover:text-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded"
            >
              View All
            </Link>
          </div>

          <div aria-live="polite" aria-busy={isLoadingAnomalies} className="space-y-3">
            {isLoadingAnomalies ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-neutral-200 animate-pulse space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-1/2" />
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-2/3" />
                </div>
              ))
            ) : (anomalies ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <iconify-icon icon="solar:check-circle-linear" width="28" height="28" className="text-emerald-400 mx-auto mb-2 block" aria-hidden="true" />
                <p className="text-sm text-neutral-500">No unusual activity detected.</p>
              </div>
            ) : (
              anomalies!.slice(0, 3).map((anomaly) => (
                <div key={anomaly._id} className="p-4 rounded-lg bg-red-50 border border-red-100 flex gap-3" role="alert">
                  <div className="mt-0.5 shrink-0">
                    <iconify-icon icon="solar:danger-triangle-linear" width="20" height="20" className="text-red-500" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-red-900 mb-1 truncate" title={anomaly.title}>
                      {anomaly.title}
                    </h3>
                    <p className="text-xs text-red-700 mb-2 line-clamp-2">{anomaly.description}</p>
                    <Link
                      href="/alerts"
                      className="text-xs font-medium text-red-700 hover:text-red-800 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 rounded"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
