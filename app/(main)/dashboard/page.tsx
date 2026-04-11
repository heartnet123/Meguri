'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function StatSkeleton({ wide }: { wide?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`h-8 bg-surface-raised rounded animate-pulse ${wide ? 'w-32' : 'w-16'}`}
    />
  );
}

function TextSkeleton({ className = 'w-24' }: { className?: string }) {
  return <div aria-hidden="true" className={`h-3.5 bg-surface-raised rounded animate-pulse ${className}`} />;
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
    <div className="bg-surface border border-border rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-muted leading-snug pr-2">{title}</h3>
        <div className="p-2 rounded-lg bg-accent-subtle text-accent shrink-0" aria-hidden="true">
          <iconify-icon icon={icon} width="20" height="20" />
        </div>
      </div>
      <div className="text-2xl font-medium tracking-tight text-foreground mb-1 tabular-nums">
        {loading ? <StatSkeleton wide /> : (value ?? '—')}
      </div>
      {loading ? (
        <TextSkeleton className="w-20 mt-1" />
      ) : change ? (
        <div
          className={`text-xs font-medium ${
            positive ? 'text-success' : negative ? 'text-danger' : 'text-muted'
          }`}
        >
          {change}
        </div>
      ) : subtitle ? (
        <div className="text-xs text-muted">{subtitle}</div>
      ) : null}
    </div>
  );
}

// ─── Live Sales vs Forecast Bar Chart ────────────────────────────────────────

type TrendDay = { label: string; revenue: number; orderCount: number };

function SalesTrendChart({ data, loading }: { data: TrendDay[] | undefined; loading: boolean }) {
  // Compute max revenue for scaling; fallback to 1 to avoid division by zero
  const maxRevenue = useMemo(
    () => (data && data.length > 0 ? Math.max(...data.map((d) => d.revenue), 1) : 1),
    [data]
  );

  if (loading) {
    return (
      <div className="h-64 w-full flex items-end gap-2" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-1">
            <div
              className="w-full bg-surface-raised rounded-t-sm animate-pulse"
              style={{ height: `${30 + Math.sin(i) * 20 + 30}%` }}
            />
            <div className="h-3 bg-surface-raised rounded animate-pulse mx-1 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const isEmpty = !data || data.every((d) => d.revenue === 0);

  return (
    <div
      className="h-64 w-full relative flex items-end gap-2"
      role="img"
      aria-label={
        isEmpty
          ? 'Sales bar chart — no sales recorded this week yet.'
          : `Weekly sales bar chart. Highest day: ${fmt(maxRevenue)}.`
      }
    >
      {(data ?? Array.from({ length: 7 }, (_, i) => ({ label: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], revenue: 0, orderCount: 0 }))).map((day, i) => {
        const heightPct = isEmpty ? 0 : Math.max((day.revenue / maxRevenue) * 100, day.revenue > 0 ? 4 : 0);
        return (
          <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
            <div
              className="relative w-full rounded-t-sm overflow-hidden transition-all duration-500"
              style={{ height: isEmpty ? '8%' : `${Math.max(heightPct, 8)}%` }}
            >
              {/* Background track */}
              <div className="absolute inset-0 bg-surface-raised rounded-t-sm" />
              {/* Actual revenue bar */}
              {!isEmpty && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-sm transition-all duration-700 ease-out"
                  style={{ height: `${heightPct > 0 ? 82 : 0}%` }}
                />
              )}
              {/* Hover tooltip */}
              {!isEmpty && day.revenue > 0 && (
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-surface text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  aria-hidden="true"
                >
                  {fmt(day.revenue)}
                </div>
              )}
            </div>
            <div className="text-xs text-center text-muted-fg mt-2" aria-hidden="true">
              {day.label}
            </div>
          </div>
        );
      })}

      {/* Empty state overlay */}
      {isEmpty && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted text-center">
            No sales recorded this week yet.<br />Record your first order to see the chart.
          </p>
        </div>
      )}
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
    <div className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0 last:pb-0 gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground truncate" title={item.name}>
          {item.name}
        </div>
        <div className="text-xs text-muted">
          Min: {item.minStockLevel.toLocaleString()} {item.unit}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-sm font-medium tabular-nums ${isCritical ? 'text-danger' : 'text-warning'}`}>
          {item.currentStock.toLocaleString()} {item.unit}
        </div>
        <div
          className={`text-xs font-medium px-1.5 py-0.5 rounded inline-block mt-1 ${
            isCritical ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'
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
    <div className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0 animate-pulse">
      <div className="space-y-1.5 flex-1 mr-4">
        <div className="h-4 bg-surface-raised rounded w-3/4" />
        <div className="h-3 bg-surface-raised rounded w-1/3" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="h-4 bg-surface-raised rounded w-16" />
        <div className="h-4 bg-surface-raised rounded w-12 ml-auto" />
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
    <div className="p-3 rounded-lg border border-border bg-faint hover:bg-subtle transition-colors">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate" title={rec.itemName}>
            {rec.itemName}
          </div>
          <div className="text-xs text-muted truncate" title={rec.supplierName}>
            from {rec.supplierName}
          </div>
        </div>
        <div className="text-sm font-medium text-foreground bg-surface px-2 py-1 rounded border border-border shadow-sm shrink-0 tabular-nums">
          {rec.recommendedQty.toLocaleString()} units
        </div>
      </div>
      <div className="text-xs text-foreground/70 flex gap-1.5 items-start">
        <iconify-icon icon="solar:info-circle-linear" width="14" height="14" className="text-muted shrink-0 mt-0.5" aria-hidden="true" />
        <span className="line-clamp-2">{rec.reason}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 bg-accent text-accent-fg text-xs font-medium py-1.5 rounded-md hover:bg-accent/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
          Accept &amp; Order
        </button>
        <button className="px-3 bg-surface text-foreground text-xs font-medium py-1.5 rounded-md border border-border hover:bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
          Edit
        </button>
      </div>
    </div>
  );
}

function RecSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-border animate-pulse space-y-2">
      <div className="flex justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-surface-raised rounded w-2/3" />
          <div className="h-3 bg-surface-raised rounded w-1/3" />
        </div>
        <div className="h-8 w-16 bg-surface-raised rounded" />
      </div>
      <div className="h-3 bg-surface-raised rounded w-full" />
      <div className="h-3 bg-surface-raised rounded w-3/4" />
      <div className="flex gap-2 mt-1">
        <div className="flex-1 h-7 bg-surface-raised rounded-md" />
        <div className="w-14 h-7 bg-surface-raised rounded-md" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const workspaceId = useWorkspaceId();
  const args = workspaceId ? { workspaceId } : 'skip';

  const summary = useQuery(api.dashboard.summary, args);
  const lowStockItems = useQuery(api.dashboard.lowStockItems, args) as LowStockItem[] | undefined;
  const reorderRecs = useQuery(api.dashboard.reorderRecommendations, args) as Recommendation[] | undefined;
  const anomalies = useQuery(api.dashboard.anomalies, args);
  const salesTrend = useQuery(api.dashboard.salesTrend, args) as TrendDay[] | undefined;

  const isLoadingSummary = workspaceId !== undefined && summary === undefined;
  const isLoadingLowStock = workspaceId !== undefined && lowStockItems === undefined;
  const isLoadingRecs = workspaceId !== undefined && reorderRecs === undefined;
  const isLoadingAnomalies = workspaceId !== undefined && anomalies === undefined;
  const isLoadingTrend = workspaceId !== undefined && salesTrend === undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Welcome back. Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-subtle transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            <iconify-icon icon="solar:calendar-linear" width="18" height="18" aria-hidden="true" />
            Today
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-accent-fg bg-accent rounded-lg hover:bg-accent/90 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
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
        {/* Sales Trend Chart — live data from salesTrend query */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-foreground">Sales This Week</h2>
            <div className="flex items-center gap-3 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-accent" aria-hidden="true" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-surface-raised" aria-hidden="true" />
                <span>No data</span>
              </div>
            </div>
          </div>
          <SalesTrendChart data={salesTrend} loading={isLoadingTrend} />
        </div>

        {/* Low Stock Widget */}
        <div className="bg-surface border border-border rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-foreground">Low Stock Alerts</h2>
            <Link
              href="/alerts"
              className="text-sm text-accent hover:text-accent/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              View All
            </Link>
          </div>
          <div className="flex-1 space-y-1" aria-live="polite" aria-busy={isLoadingLowStock}>
            {isLoadingLowStock ? (
              Array.from({ length: 3 }).map((_, i) => <LowStockSkeleton key={i} />)
            ) : (lowStockItems ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <iconify-icon icon="solar:check-circle-linear" width="28" height="28" className="text-success mx-auto mb-2 block" aria-hidden="true" />
                <p className="text-sm text-muted">All items are well stocked.</p>
              </div>
            ) : (
              lowStockItems!.map((item) => <LowStockRow key={item._id} item={item} />)
            )}
          </div>
          {!isLoadingLowStock && (lowStockItems ?? []).length > 0 && (
            <Link
              href="/purchase-planning"
              className="w-full mt-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground text-center block"
            >
              Place Reorders
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Reorder Recommendations */}
        <div className="bg-surface border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base font-medium text-foreground truncate">AI Reorder Recommendations</h2>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-success-subtle text-success border border-success/20 shrink-0">
                AI
              </span>
            </div>
          </div>
          <div className="space-y-3" aria-live="polite" aria-busy={isLoadingRecs}>
            {isLoadingRecs ? (
              <><RecSkeleton /><RecSkeleton /></>
            ) : (reorderRecs ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <iconify-icon icon="solar:cart-large-linear" width="28" height="28" className="text-muted-fg mx-auto mb-2 block" aria-hidden="true" />
                <p className="text-sm text-muted">No pending recommendations.</p>
              </div>
            ) : (
              reorderRecs!.map((rec) => <RecommendationCard key={rec._id} rec={rec} />)
            )}
          </div>
        </div>

        {/* Anomalies */}
        <div className="bg-surface border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-foreground">Anomalies Detected</h2>
            <Link
              href="/alerts"
              className="text-sm text-accent hover:text-accent/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              View All
            </Link>
          </div>

          <div aria-live="polite" aria-busy={isLoadingAnomalies} className="space-y-3">
            {isLoadingAnomalies ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border animate-pulse space-y-2">
                  <div className="h-4 bg-surface-raised rounded w-1/2" />
                  <div className="h-3 bg-surface-raised rounded w-3/4" />
                  <div className="h-3 bg-surface-raised rounded w-2/3" />
                </div>
              ))
            ) : (anomalies ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <iconify-icon icon="solar:check-circle-linear" width="28" height="28" className="text-success mx-auto mb-2 block" aria-hidden="true" />
                <p className="text-sm text-muted">No unusual activity detected.</p>
              </div>
            ) : (
              anomalies!.slice(0, 3).map((anomaly) => (
                <div key={anomaly._id} className="p-4 rounded-lg bg-danger-subtle border border-danger/20 flex gap-3" role="alert">
                  <div className="mt-0.5 shrink-0">
                    <iconify-icon icon="solar:danger-triangle-linear" width="20" height="20" className="text-danger" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-danger mb-1 truncate" title={anomaly.title}>
                      {anomaly.title}
                    </h3>
                    <p className="text-xs text-danger/80 mb-2 line-clamp-2">{anomaly.description}</p>
                    <Link
                      href="/alerts"
                      className="text-xs font-medium text-danger hover:text-danger/80 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded"
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
