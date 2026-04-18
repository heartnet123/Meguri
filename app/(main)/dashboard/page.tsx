'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

type TrendDay = { label: string; revenue: number; orderCount: number };
type LowStockItem = {
  _id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  status: 'Critical' | 'Warning';
};
type Recommendation = {
  _id: string;
  itemName: string;
  supplierName: string;
  recommendedQty: number;
  reason: string;
};
type Anomaly = {
  _id: string;
  title: string;
  description: string;
};

const DEFAULT_TREND_DAYS: TrendDay[] = [
  { label: 'Mon', revenue: 0, orderCount: 0 },
  { label: 'Tue', revenue: 0, orderCount: 0 },
  { label: 'Wed', revenue: 0, orderCount: 0 },
  { label: 'Thu', revenue: 0, orderCount: 0 },
  { label: 'Fri', revenue: 0, orderCount: 0 },
  { label: 'Sat', revenue: 0, orderCount: 0 },
  { label: 'Sun', revenue: 0, orderCount: 0 },
];

function StatSkeleton({ wide }: { wide?: boolean }) {
  return <div aria-hidden="true" className={`h-8 rounded-lg bg-surface-raised ${wide ? 'w-32' : 'w-20'} animate-pulse`} />;
}

function TextSkeleton({ className = 'w-24' }: { className?: string }) {
  return <div aria-hidden="true" className={`h-4 rounded-md bg-surface-raised ${className} animate-pulse`} />;
}

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function metaToneClass(tone: 'muted' | 'success' | 'danger') {
  if (tone === 'success') return 'text-success';
  if (tone === 'danger') return 'text-danger';
  return 'text-muted';
}

function KpiCard({
  title,
  value,
  meta,
  tone = 'muted',
  loading,
}: {
  title: string;
  value?: string | number;
  meta?: string;
  tone?: 'muted' | 'success' | 'danger';
  loading?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-medium text-muted">{title}</p>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {loading ? <StatSkeleton wide /> : (value ?? '—')}
      </div>
      {loading ? (
        <div className="mt-2">
          <TextSkeleton className="w-28" />
        </div>
      ) : meta ? (
        <p className={`mt-2 text-sm ${metaToneClass(tone)}`}>{meta}</p>
      ) : null}
    </section>
  );
}

function SalesTrendChart({ data, loading }: { data: TrendDay[] | undefined; loading: boolean }) {
  const chartData = data ?? DEFAULT_TREND_DAYS;
  const maxRevenue = useMemo(
    () => (chartData.length > 0 ? Math.max(...chartData.map((day) => day.revenue), 1) : 1),
    [chartData]
  );
  const isEmpty = chartData.every((day) => day.revenue === 0);

  if (loading) {
    return (
      <div className="grid h-56 grid-cols-7 items-end gap-3" aria-hidden="true">
        {DEFAULT_TREND_DAYS.map((day, index) => (
          <div key={day.label} className="flex flex-col gap-3">
            <div className="h-44 rounded-t-lg bg-surface-raised/70 animate-pulse" style={{ opacity: 0.6 + index * 0.04 }} />
            <div className="mx-2 h-3 rounded-full bg-surface-raised animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="grid h-56 grid-cols-7 items-end gap-3"
        role="img"
        aria-label={
          isEmpty
            ? 'No sales have been recorded this week yet.'
            : `Weekly sales chart. Highest day reached ${fmtCurrency(maxRevenue)} in revenue.`
        }
      >
        {chartData.map((day) => {
          const height = isEmpty ? 8 : Math.max((day.revenue / maxRevenue) * 100, day.revenue > 0 ? 12 : 0);

          return (
            <div key={day.label} className="flex flex-col gap-3">
              <div className="relative h-44 overflow-hidden rounded-t-lg bg-faint">
                <div
                  className={`absolute inset-x-0 bottom-0 rounded-t-lg transition-[height] duration-500 ${
                    isEmpty ? 'bg-surface-raised' : 'bg-accent'
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="text-center text-xs text-muted">{day.label}</div>
            </div>
          );
        })}
      </div>

      {isEmpty && <p className="text-sm text-muted">Sales appear here as soon as transactions are recorded.</p>}
    </div>
  );
}

function LowStockRow({ item }: { item: LowStockItem }) {
  const isCritical = item.status === 'Critical';

  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-4 first:border-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground" title={item.name}>
          {item.name}
        </p>
        <p className="mt-1 text-xs text-muted">
          Minimum {item.minStockLevel.toLocaleString()} {item.unit}
        </p>
      </div>

      <div className="text-right">
        <p className={`text-sm font-semibold tabular-nums ${isCritical ? 'text-danger' : 'text-warning'}`}>
          {item.currentStock.toLocaleString()} {item.unit}
        </p>
        <p className={`mt-1 text-xs ${isCritical ? 'text-danger' : 'text-warning'}`}>{item.status}</p>
      </div>
    </div>
  );
}

function LowStockSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border py-4 first:border-0 first:pt-0 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-md bg-surface-raised" />
        <div className="h-3 w-24 rounded-md bg-surface-raised" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-4 w-16 rounded-md bg-surface-raised" />
        <div className="h-3 w-14 rounded-md bg-surface-raised" />
      </div>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-4 first:border-0 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground" title={rec.itemName}>
          {rec.itemName}
        </p>
        <p className="truncate text-xs text-muted" title={rec.supplierName}>
          {rec.supplierName}
        </p>
        <p className="line-clamp-2 text-sm text-muted">{rec.reason}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xl font-semibold tabular-nums text-foreground">{rec.recommendedQty.toLocaleString()}</p>
        <p className="text-xs text-muted">units</p>
      </div>
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="space-y-2 border-t border-border py-4 first:border-0 first:pt-0 animate-pulse">
      <div className="h-4 w-32 rounded-md bg-surface-raised" />
      <div className="h-3 w-24 rounded-md bg-surface-raised" />
      <div className="h-3 w-full rounded-md bg-surface-raised" />
    </div>
  );
}

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  return (
    <div className="border-t border-border py-4 first:border-0 first:pt-0 last:pb-0">
      <p className="text-sm font-semibold text-foreground">{anomaly.title}</p>
      <p className="mt-1 text-sm text-muted">{anomaly.description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const args = workspaceId && isAuthenticated ? { workspaceId } : 'skip';

  const summary = useQuery(api.dashboard.summary, args);
  const lowStockItems = useQuery(api.dashboard.lowStockItems, args) as LowStockItem[] | undefined;
  const reorderRecs = useQuery(api.dashboard.reorderRecommendations, args) as Recommendation[] | undefined;
  const anomalies = useQuery(api.dashboard.anomalies, args) as Anomaly[] | undefined;
  const salesTrend = useQuery(api.dashboard.salesTrend, args) as TrendDay[] | undefined;

  const isLoadingSummary = workspaceId !== undefined && summary === undefined;
  const isLoadingLowStock = workspaceId !== undefined && lowStockItems === undefined;
  const isLoadingRecs = workspaceId !== undefined && reorderRecs === undefined;
  const isLoadingAnomalies = workspaceId !== undefined && anomalies === undefined;
  const isLoadingTrend = workspaceId !== undefined && salesTrend === undefined;

  const weeklyRevenue = useMemo(
    () => (salesTrend ?? []).reduce((total, day) => total + day.revenue, 0),
    [salesTrend]
  );
  const weeklyOrders = useMemo(
    () => (salesTrend ?? []).reduce((total, day) => total + day.orderCount, 0),
    [salesTrend]
  );

  const stockRiskCount = lowStockItems?.length ?? 0;
  const displayedRecommendations = reorderRecs?.slice(0, 3) ?? [];
  const displayedAnomalies = anomalies?.slice(0, 3) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted">Today at a glance</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Monitor sales, stock risks, and purchase signals without leaving this page.
          </p>
        </div>

        <Link
          href="/sales"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/90"
        >
          Record entry
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Revenue today"
          value={summary ? fmtCurrency(summary.todayRevenue) : undefined}
          meta={summary ? `${summary.todayOrderCount} orders recorded` : undefined}
          tone="success"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="Low-stock items"
          value={summary?.lowStockCount}
          meta={summary ? `${summary.criticalCount} need attention` : undefined}
          tone={summary && summary.criticalCount > 0 ? 'danger' : 'muted'}
          loading={isLoadingSummary}
        />
        <KpiCard
          title="Recommended orders"
          value={summary?.pendingRecommendations}
          meta="Ready for review"
          loading={isLoadingSummary}
        />
        <KpiCard
          title="Open alerts"
          value={summary?.openAlertCount}
          meta={summary?.openAlertCount === 0 ? 'All clear' : 'Review pending issues'}
          tone={summary?.openAlertCount === 0 ? 'success' : 'danger'}
          loading={isLoadingSummary}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sales this week</h2>
              <p className="mt-1 text-sm text-muted">Daily revenue from recorded orders.</p>
            </div>
            {!isLoadingTrend && weeklyRevenue > 0 && (
              <p className="text-sm text-muted">
                {fmtCurrency(weeklyRevenue)} across {weeklyOrders.toLocaleString()} orders
              </p>
            )}
          </div>

          <div className="pt-6">
            <SalesTrendChart data={salesTrend} loading={isLoadingTrend} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Stock risks</h2>
              <p className="mt-1 text-sm text-muted">Items close to or below their minimum level.</p>
            </div>
            <Link href="/alerts" className="text-sm font-medium text-accent hover:text-accent/80">
              View all
            </Link>
          </div>

          <div className="pt-6" aria-live="polite" aria-busy={isLoadingLowStock}>
            {isLoadingLowStock ? (
              Array.from({ length: 4 }).map((_, index) => <LowStockSkeleton key={index} />)
            ) : stockRiskCount === 0 ? (
              <p className="text-sm text-muted">Nothing needs restocking right now.</p>
            ) : (
              lowStockItems?.map((item) => <LowStockRow key={item._id} item={item} />)
            )}
          </div>

          {!isLoadingLowStock && stockRiskCount > 0 && (
            <Link
              href="/purchase-planning"
              className="mt-6 inline-flex text-sm font-medium text-accent hover:text-accent/80"
            >
              Open purchase plan
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Purchase recommendations</h2>
              <p className="mt-1 text-sm text-muted">The next items worth ordering based on current demand.</p>
            </div>
            <Link href="/purchase-planning" className="text-sm font-medium text-accent hover:text-accent/80">
              Open planning
            </Link>
          </div>

          <div className="pt-6" aria-live="polite" aria-busy={isLoadingRecs}>
            {isLoadingRecs ? (
              Array.from({ length: 3 }).map((_, index) => <RecommendationSkeleton key={index} />)
            ) : displayedRecommendations.length === 0 ? (
              <p className="text-sm text-muted">No order recommendations are waiting for review.</p>
            ) : (
              displayedRecommendations.map((rec) => <RecommendationRow key={rec._id} rec={rec} />)
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Open anomalies</h2>
              <p className="mt-1 text-sm text-muted">Issues that still need review.</p>
            </div>
            <Link href="/alerts" className="text-sm font-medium text-accent hover:text-accent/80">
              Review alerts
            </Link>
          </div>

          <div className="pt-6" aria-live="polite" aria-busy={isLoadingAnomalies}>
            {isLoadingAnomalies ? (
              Array.from({ length: 3 }).map((_, index) => <RecommendationSkeleton key={index} />)
            ) : displayedAnomalies.length === 0 ? (
              <p className="text-sm text-muted">No anomalies are open.</p>
            ) : (
              displayedAnomalies.map((anomaly) => <AnomalyRow key={anomaly._id} anomaly={anomaly} />)
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
