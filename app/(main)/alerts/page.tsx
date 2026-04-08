'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

type Alert = {
  _id: Id<'alerts'>;
  displayId: string;
  type: 'low_stock' | 'unusual_demand' | 'supplier' | 'price_change' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'open' | 'resolved';
  createdAt: number;
};

type AlertStats = {
  open: number;
  critical: number;
  unusual: number;
  lowStock: number;
};

const TYPE_LABELS: Record<Alert['type'], string> = {
  low_stock: 'Low Stock',
  unusual_demand: 'Unusual',
  supplier: 'Supplier',
  price_change: 'Price Change',
  system: 'System',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatSkeleton() {
  return <div className="h-7 w-10 bg-neutral-100 rounded animate-pulse" />;
}

function AlertSkeleton() {
  return (
    <li aria-hidden="true" className="p-4 flex gap-4 animate-pulse">
      <div className="w-5 h-5 bg-neutral-100 rounded-full mt-1 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-neutral-100 rounded w-1/3" />
        <div className="h-3 bg-neutral-100 rounded w-2/3" />
        <div className="h-3 bg-neutral-100 rounded w-1/4 mt-2" />
      </div>
    </li>
  );
}

function getSeverityIcon(severity: Alert['severity']) {
  switch (severity) {
    case 'critical': return <iconify-icon icon="solar:danger-triangle-linear" width="20" height="20" className="text-red-600" aria-hidden="true" />;
    case 'high':     return <iconify-icon icon="solar:danger-triangle-linear" width="20" height="20" className="text-orange-500" aria-hidden="true" />;
    case 'medium':   return <iconify-icon icon="solar:bell-linear" width="20" height="20" className="text-amber-500" aria-hidden="true" />;
    case 'low':      return <iconify-icon icon="solar:info-circle-linear" width="20" height="20" className="text-blue-500" aria-hidden="true" />;
  }
}

function getSeverityClass(severity: Alert['severity']) {
  switch (severity) {
    case 'critical': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
    case 'high':     return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20';
    case 'medium':   return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
    case 'low':      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
  }
}

export default function AlertsPage() {
  const workspaceId = useWorkspaceId();
  const alerts = useQuery(
    api.alerts.list,
    workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  ) as Alert[] | undefined;
  const stats = useQuery(
    api.alerts.stats,
    workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  ) as AlertStats | undefined;

  const resolve = useMutation(api.alerts.resolve);
  const resolveAll = useMutation(api.alerts.resolveAll);

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingAll, setResolvingAll] = useState(false);

  const isLoading = workspaceId !== undefined && alerts === undefined;

  const filtered = useMemo(() => {
    if (!alerts) return [];
    const s = search.toLowerCase();
    return alerts.filter((a) => {
      if (s && !a.title.toLowerCase().includes(s) && !a.description.toLowerCase().includes(s))
        return false;
      if (severityFilter && a.severity !== severityFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      return true;
    });
  }, [alerts, search, severityFilter, typeFilter]);

  async function handleResolve(id: Id<'alerts'>) {
    setResolvingId(id);
    try {
      await resolve({ id });
    } finally {
      setResolvingId(null);
    }
  }

  async function handleResolveAll() {
    if (!workspaceId) return;
    setResolvingAll(true);
    try {
      await resolveAll({ workspaceId: workspaceId as Id<'workspaces'> });
    } finally {
      setResolvingAll(false);
    }
  }

  const hasOpenAlerts = (stats?.open ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Alerts &amp; Warnings</h1>
          <p className="text-sm text-neutral-500 mt-1">Track stock issues, unusual activity, and supplier updates.</p>
        </div>
        <button
          onClick={handleResolveAll}
          disabled={resolvingAll || !hasOpenAlerts || !workspaceId}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <iconify-icon icon="solar:check-circle-linear" width="18" height="18" aria-hidden="true" />
          {resolvingAll ? 'Resolving…' : 'Resolve All'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Alerts', value: stats?.open, className: 'text-neutral-900' },
          { label: 'Critical Alerts', value: stats?.critical, className: 'text-red-600' },
          { label: 'Unusual Activity', value: stats?.unusual, className: 'text-indigo-600' },
          { label: 'Stock Warnings', value: stats?.lowStock, className: 'text-amber-600' },
        ].map(({ label, value, className }) => (
          <div key={label} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="text-sm font-medium text-neutral-600 mb-1">{label}</div>
            <div className={`text-2xl font-medium tracking-tight ${className}`}>
              {value === undefined ? <StatSkeleton /> : value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts…"
              aria-label="Search alerts"
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:border-neutral-900 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <ul className="divide-y divide-neutral-200" aria-label="Alerts list" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <AlertSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <li className="px-6 py-20 text-center">
              <iconify-icon icon="solar:bell-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-700">
                {(alerts ?? []).length === 0 ? 'No alerts' : 'No alerts match your filters'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {(alerts ?? []).length === 0 ? "You're all clear." : 'Try adjusting your search or filters.'}
              </p>
            </li>
          ) : (
            filtered.map((alert) => (
              <li
                key={alert._id}
                className={`p-4 hover:bg-neutral-50/50 transition-colors flex gap-4 ${alert.status === 'resolved' ? 'opacity-60' : ''}`}
              >
                <div className="flex-shrink-0 mt-1" aria-label={`${alert.severity} severity`}>
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-sm font-medium text-neutral-900 truncate" title={alert.title}>
                      {alert.title}
                    </h2>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider shrink-0 ${getSeverityClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200 shrink-0">
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                    <time
                      className="text-xs text-neutral-500 ml-auto whitespace-nowrap shrink-0"
                      dateTime={new Date(alert.createdAt).toISOString()}
                      title={new Date(alert.createdAt).toLocaleString()}
                    >
                      {timeAgo(alert.createdAt)}
                    </time>
                  </div>
                  <p className="text-sm text-neutral-600 line-clamp-2">{alert.description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    {alert.status === 'open' ? (
                      <>
                        <button className="text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded">
                          View Details
                        </button>
                        <button
                          onClick={() => handleResolve(alert._id)}
                          disabled={resolvingId === alert._id}
                          className="text-xs font-medium text-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded disabled:opacity-50"
                        >
                          {resolvingId === alert._id ? 'Resolving…' : 'Mark as Resolved'}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <iconify-icon icon="solar:check-circle-linear" width="14" height="14" aria-hidden="true" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    aria-label={`More options for alert: ${alert.title}`}
                  >
                    <iconify-icon icon="solar:menu-dots-bold" width="20" height="20" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {filtered.length > 0 && (
          <div className="p-4 border-t border-neutral-200 text-center text-sm text-neutral-500 bg-neutral-50/50">
            Showing {filtered.length.toLocaleString()} of {(alerts ?? []).length.toLocaleString()} alert{(alerts ?? []).length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
