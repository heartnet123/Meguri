'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function StatSkeleton({ wide }: { wide?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`h-8 bg-surface-raised rounded-xl animate-pulse ${wide ? 'w-32' : 'w-16'}`}
    />
  );
}

function TextSkeleton({ className = 'w-24' }: { className?: string }) {
  return <div aria-hidden="true" className={`h-3.5 bg-surface-raised rounded-lg animate-pulse ${className}`} />;
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
    <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 group transition-all hover:border-accent/20">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60 leading-snug pr-2">{title}</h3>
        <div className="p-2.5 rounded-xl bg-accent-subtle text-accent shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true">
          <iconify-icon icon={icon} width="22" height="22" />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight text-foreground mb-1 tabular-nums">
        {loading ? <StatSkeleton wide /> : (value ?? '—')}
      </div>
      {loading ? (
        <TextSkeleton className="w-20 mt-1" />
      ) : change ? (
        <div
          className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
            positive ? 'text-success' : negative ? 'text-danger' : 'text-muted'
          }`}
        >
          {positive && <iconify-icon icon="solar:graph-up-bold-duotone" width="14" height="14" />}
          {negative && <iconify-icon icon="solar:graph-down-bold-duotone" width="14" height="14" />}
          {change}
        </div>
      ) : subtitle ? (
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted/40">{subtitle}</div>
      ) : null}
    </div>
  );
}

// ─── Live Sales vs Forecast Bar Chart ────────────────────────────────────────

type TrendDay = { label: string; revenue: number; orderCount: number };

function SalesTrendChart({ data, loading }: { data: TrendDay[] | undefined; loading: boolean }) {
  const maxRevenue = useMemo(
    () => (data && data.length > 0 ? Math.max(...data.map((d) => d.revenue), 1) : 1),
    [data]
  );

  if (loading) {
    return (
      <div className="h-64 w-full flex items-end gap-3" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-2">
            <div
              className="w-full bg-surface-raised rounded-t-xl animate-pulse"
              style={{ height: `${30 + Math.sin(i) * 20 + 30}%` }}
            />
            <div className="h-3 bg-surface-raised rounded-full animate-pulse mx-2 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const isEmpty = !data || data.every((d) => d.revenue === 0);

  return (
    <div
      className="h-64 w-full relative flex items-end gap-3 group/chart"
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
          <div key={i} className="flex-1 flex flex-col justify-end gap-2 group/bar">
            <div
              className="relative w-full rounded-t-xl overflow-hidden transition-all duration-700 ease-out"
              style={{ height: isEmpty ? '8%' : `${Math.max(heightPct, 8)}%` }}
            >
              {/* Background track */}
              <div className="absolute inset-0 bg-surface-raised/50 rounded-t-xl" />
              {/* Actual revenue bar */}
              {!isEmpty && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-accent to-accent-light rounded-t-xl transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
                  style={{ height: `${heightPct > 0 ? 100 : 0}%` }}
                />
              )}
              {/* Hover tooltip */}
              {!isEmpty && day.revenue > 0 && (
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-surface text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-10 shadow-xl"
                  aria-hidden="true"
                >
                  {fmt(day.revenue)}
                </div>
              )}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-center text-muted/40 mt-2 transition-colors group-hover/bar:text-accent" aria-hidden="true">
              {day.label}
            </div>
          </div>
        );
      })}

      {/* Empty state overlay */}
      {isEmpty && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="p-3 bg-surface-raised rounded-2xl mb-3 border border-border">
            <iconify-icon icon="solar:gallery-wide-bold-duotone" width="24" height="24" className="text-muted/20" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 text-center leading-relaxed">
            Awaiting sales data<br />for visualization
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
    <div className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0 last:pb-0 gap-4 group/row">
      <div className="min-w-0">
        <div className="text-sm font-bold text-foreground truncate group-hover/row:text-accent transition-colors" title={item.name}>
          {item.name}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted/40 mt-0.5">
          Min Level: {item.minStockLevel.toLocaleString()} {item.unit}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-sm font-black tabular-nums tracking-tight ${isCritical ? 'text-danger' : 'text-warning'}`}>
          {item.currentStock.toLocaleString()} <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">{item.unit}</span>
        </div>
        <div
          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mt-1.5 border shadow-sm ${
            isCritical ? 'bg-danger-subtle/50 text-danger border-danger/10' : 'bg-warning-subtle/50 text-warning border-warning/10'
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
    <div className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0 animate-pulse">
      <div className="space-y-2 flex-1 mr-4">
        <div className="h-4 bg-surface-raised rounded-lg w-3/4" />
        <div className="h-3 bg-surface-raised rounded-md w-1/3" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-4 bg-surface-raised rounded-lg w-16" />
        <div className="h-4 bg-surface-raised rounded-full w-12 ml-auto" />
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
    <div className="p-4 rounded-2xl border border-border bg-surface-raised/30 hover:bg-surface-raised/60 transition-all hover:border-accent/20 group/rec">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground truncate group-hover/rec:text-accent transition-colors" title={rec.itemName}>
            {rec.itemName}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/40 truncate mt-0.5" title={rec.supplierName}>
            Proprietary Supplier: <span className="text-foreground/70">{rec.supplierName}</span>
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent-subtle/50 px-2.5 py-1.5 rounded-xl border border-accent/10 shrink-0 tabular-nums shadow-sm">
          + {rec.recommendedQty.toLocaleString()} units
        </div>
      </div>
      <div className="text-xs text-muted leading-relaxed flex gap-2 items-start font-medium">
        <div className="p-1 bg-accent/5 rounded-md mt-0.5 shrink-0">
          <iconify-icon icon="solar:magic-stick-bold-duotone" width="14" height="14" className="text-accent" aria-hidden="true" />
        </div>
        <span className="line-clamp-2 italic">&ldquo;{rec.reason}&rdquo;</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/10 active:scale-[0.98]">
          Accept &amp; Order
        </button>
        <button className="px-4 bg-surface text-muted text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl border border-border hover:bg-surface-raised transition-all active:scale-[0.98]">
          Review
        </button>
      </div>
    </div>
  );
}

function RecSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-border animate-pulse space-y-3">
      <div className="flex justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-surface-raised rounded-lg w-2/3" />
          <div className="h-3 bg-surface-raised rounded-md w-1/3" />
        </div>
        <div className="h-10 w-20 bg-surface-raised rounded-xl" />
      </div>
      <div className="h-3 bg-surface-raised rounded-md w-full" />
      <div className="h-3 bg-surface-raised rounded-md w-3/4" />
      <div className="flex gap-2 mt-2">
        <div className="flex-1 h-9 bg-surface-raised rounded-xl" />
        <div className="w-16 h-9 bg-surface-raised rounded-xl" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const args = (workspaceId && isAuthenticated) ? { workspaceId } : 'skip';

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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Overview</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">
            Welcome back. Here&apos;s a strategic pulse of your inventory and sales performance.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised transition-all shadow-sm focus:outline-none">
            <iconify-icon icon="solar:calendar-bold-duotone" width="18" height="18" aria-hidden="true" />
            Live Feed
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 active:scale-[0.98]">
            <iconify-icon icon="solar:add-circle-bold-duotone" width="18" height="18" aria-hidden="true" />
            Record Entry
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Daily Gross Revenue"
          value={summary ? fmt(summary.todayRevenue) : undefined}
          change={summary ? `${summary.todayOrderCount} successful orders` : undefined}
          positive
          icon="solar:wallet-money-bold-duotone"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="Inventory Alerts"
          value={summary?.lowStockCount}
          change={summary ? `${summary.criticalCount} priority items` : undefined}
          negative={summary ? summary.criticalCount > 0 : undefined}
          icon="solar:danger-triangle-bold-duotone"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="AI Replenishment"
          value={summary?.pendingRecommendations}
          subtitle="Smart optimizations"
          icon="solar:graph-up-bold-duotone"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="System Security"
          value={summary?.openAlertCount}
          change={summary?.openAlertCount === 0 ? 'Protocol optimal' : undefined}
          positive={summary?.openAlertCount === 0}
          negative={summary ? summary.openAlertCount > 0 : undefined}
          icon="solar:shield-warning-bold-duotone"
          loading={isLoadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart — live data from salesTrend query */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl shadow-sm p-7">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-base font-bold text-foreground tracking-tight">Weekly Performance Velocity</h2>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-md shadow-accent/20" aria-hidden="true" />
                <span className="text-muted">Recorded Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-surface-raised" aria-hidden="true" />
                <span className="text-muted/40">Projection</span>
              </div>
            </div>
          </div>
          <SalesTrendChart data={salesTrend} loading={isLoadingTrend} />
        </div>

        {/* Low Stock Widget */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-foreground tracking-tight">Stock Deviations</h2>
            <Link
              href="/alerts"
              className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
            >
              Monitor All
            </Link>
          </div>
          <div className="flex-1 space-y-1" aria-live="polite" aria-busy={isLoadingLowStock}>
            {isLoadingLowStock ? (
              Array.from({ length: 4 }).map((_, i) => <LowStockSkeleton key={i} />)
            ) : (lowStockItems ?? []).length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-success-subtle/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/10">
                  <iconify-icon icon="solar:check-circle-bold-duotone" width="32" height="32" className="text-success shadow-sm" aria-hidden="true" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Inventory Optimized</p>
              </div>
            ) : (
              lowStockItems!.map((item) => <LowStockRow key={item._id} item={item} />)
            )}
          </div>
          {!isLoadingLowStock && (lowStockItems ?? []).length > 0 && (
            <Link
              href="/purchase-planning"
              className="w-full mt-6 py-3 bg-surface border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-surface-raised transition-all text-center block active:scale-[0.98]"
            >
              Initiate Bulk Restock
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Reorder Recommendations */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-7">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-base font-bold text-foreground tracking-tight truncate">Smart Replenishment</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-success-subtle/50 text-success border border-success/10 shadow-sm">
                Active AI
              </span>
            </div>
            <Link href="/purchase-planning" className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-accent transition-colors">
              Full Report
            </Link>
          </div>
          <div className="space-y-4" aria-live="polite" aria-busy={isLoadingRecs}>
            {isLoadingRecs ? (
              <><RecSkeleton /><RecSkeleton /></>
            ) : (reorderRecs ?? []).length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-surface-raised rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                  <iconify-icon icon="solar:cart-large-bold-duotone" width="32" height="32" className="text-muted/20" aria-hidden="true" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60">No pending suggestions</p>
              </div>
            ) : (
              reorderRecs!.slice(0, 2).map((rec) => <RecommendationCard key={rec._id} rec={rec} />)
            )}
          </div>
        </div>

        {/* Anomalies */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-7">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-base font-bold text-foreground tracking-tight">Security &amp; Logic Anomalies</h2>
            <Link
              href="/alerts"
              className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-accent transition-colors"
            >
              Audits
            </Link>
          </div>

          <div aria-live="polite" aria-busy={isLoadingAnomalies} className="space-y-4">
            {isLoadingAnomalies ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl border border-border animate-pulse space-y-3">
                  <div className="h-5 bg-surface-raised rounded-lg w-1/2" />
                  <div className="h-3.5 bg-surface-raised rounded-md w-3/4" />
                  <div className="h-3.5 bg-surface-raised rounded-md w-2/3" />
                </div>
              ))
            ) : (anomalies ?? []).length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/10 relative">
                   <div className="absolute inset-0 bg-accent/10 rounded-full animate-ping opacity-20" />
                  <iconify-icon icon="solar:shield-check-bold-duotone" width="40" height="40" className="text-accent opacity-40 shadow-sm" aria-hidden="true" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60">System Integrity Zero Defect</p>
              </div>
            ) : (
              anomalies!.slice(0, 3).map((anomaly) => (
                <div key={anomaly._id} className="p-5 rounded-2xl bg-danger-subtle/30 border border-danger/10 flex gap-4 group transition-all hover:bg-danger-subtle/50" role="alert">
                  <div className="mt-0.5 shrink-0 p-2.5 bg-danger/10 rounded-xl group-hover:scale-110 transition-transform">
                    <iconify-icon icon="solar:danger-triangle-bold-duotone" width="22" height="22" className="text-danger" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-danger mb-1.5 truncate leading-none" title={anomaly.title}>
                      {anomaly.title}
                    </h3>
                    <p className="text-xs text-danger/70 mb-3 line-clamp-2 font-medium leading-relaxed italic">&ldquo;{anomaly.description}&rdquo;</p>
                    <Link
                      href="/alerts"
                      className="text-[10px] font-bold uppercase tracking-widest text-danger hover:text-danger/80 flex items-center gap-1.5 group/link"
                    >
                      Investigate Protocol
                      <iconify-icon icon="solar:arrow-right-linear" width="12" height="12" className="group-hover/link:translate-x-1 transition-transform" />
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
