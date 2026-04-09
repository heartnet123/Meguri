'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import { matchesAlertFilters } from '@/lib/alerts/inbox.js';

type AlertType = 'low_stock' | 'unusual_demand' | 'supplier' | 'price_change' | 'system';
type AlertCategory = 'stock' | 'anomaly' | 'supplier' | 'system';
type AlertStatus = 'open' | 'resolved';
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

type Alert = {
  _id: Id<'alerts'>;
  displayId: string;
  category: AlertCategory;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  href: string;
  assignedTo?: Id<'users'>;
  assignedToName?: string | null;
  resolutionNote?: string;
  resolvedByName?: string | null;
  resolvedAt?: number;
  createdAt: number;
};

type WorkspaceUser = {
  _id: Id<'users'>;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
};

type AlertStats = {
  open: number;
  critical: number;
  unusual: number;
  lowStock: number;
};

const TYPE_LABELS: Record<AlertType, string> = {
  low_stock: 'Low Stock',
  unusual_demand: 'Unusual Demand',
  supplier: 'Supplier',
  price_change: 'Price Change',
  system: 'System',
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  stock: 'Stock',
  anomaly: 'Anomaly',
  supplier: 'Supplier',
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
        <div className="h-3 bg-neutral-100 rounded w-1/2 mt-2" />
      </div>
    </li>
  );
}

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return <iconify-icon icon="solar:danger-triangle-linear" width="20" height="20" className="text-red-600" aria-hidden="true" />;
    case 'high':
      return <iconify-icon icon="solar:danger-triangle-linear" width="20" height="20" className="text-orange-500" aria-hidden="true" />;
    case 'medium':
      return <iconify-icon icon="solar:bell-linear" width="20" height="20" className="text-amber-500" aria-hidden="true" />;
    case 'low':
      return <iconify-icon icon="solar:info-circle-linear" width="20" height="20" className="text-blue-500" aria-hidden="true" />;
  }
}

function getSeverityClass(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
    case 'high':
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20';
    case 'medium':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
    case 'low':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
  }
}

function getCategoryClass(category: AlertCategory) {
  switch (category) {
    case 'stock':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
    case 'anomaly':
      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20';
    case 'supplier':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
    case 'system':
      return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200';
  }
}

function getStatusClass(status: AlertStatus) {
  return status === 'open'
    ? 'bg-neutral-900 text-white'
    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
}

export default function AlertsPage() {
  const workspaceId = useWorkspaceId();
  const alerts = useQuery(
    api.alerts.list,
    workspaceId ? { workspaceId } : 'skip'
  ) as Alert[] | undefined;
  const stats = useQuery(
    api.alerts.stats,
    workspaceId ? { workspaceId } : 'skip'
  ) as AlertStats | undefined;
  const workspaceUsers = useQuery(
    api.users.listByWorkspace,
    workspaceId ? { workspaceId } : 'skip'
  ) as WorkspaceUser[] | undefined;

  const resolve = useMutation(api.alerts.resolve);
  const resolveAll = useMutation(api.alerts.resolveAll);
  const reopen = useMutation(api.alerts.reopen);
  const assign = useMutation(api.alerts.assign);

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [resolvingAll, setResolvingAll] = useState(false);

  const isLoading = workspaceId !== undefined && alerts === undefined;

  const filtered = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((alert) =>
      matchesAlertFilters(alert, {
        search,
        severity: severityFilter,
        status: statusFilter,
        category: categoryFilter,
      })
    );
  }, [alerts, search, severityFilter, statusFilter, categoryFilter]);

  async function handleResolve(id: Id<'alerts'>) {
    setResolvingId(id);
    try {
      await resolve({ id, note: resolutionDrafts[id]?.trim() || undefined });
      setResolutionDrafts((current) => ({ ...current, [id]: '' }));
    } finally {
      setResolvingId(null);
    }
  }

  async function handleResolveAll() {
    if (!workspaceId) return;
    setResolvingAll(true);
    try {
      await resolveAll({ workspaceId });
    } finally {
      setResolvingAll(false);
    }
  }

  async function handleAssign(id: Id<'alerts'>, assignedTo: string) {
    setAssigningId(id);
    try {
      await assign({
        id,
        assignedTo: assignedTo ? (assignedTo as Id<'users'>) : null,
      });
    } finally {
      setAssigningId(null);
    }
  }

  async function handleReopen(id: Id<'alerts'>) {
    setReopeningId(id);
    try {
      await reopen({ id });
    } finally {
      setReopeningId(null);
    }
  }

  const hasOpenAlerts = (stats?.open ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Alert Inbox</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Triage stock warnings, anomaly signals, supplier issues, and system alerts from one inbox.
          </p>
        </div>
        <button
          onClick={handleResolveAll}
          disabled={resolvingAll || !hasOpenAlerts || !workspaceId}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <iconify-icon icon="solar:check-circle-linear" width="18" height="18" aria-hidden="true" />
          {resolvingAll ? 'Resolving…' : 'Resolve All Open'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Alerts', value: stats?.open, className: 'text-neutral-900' },
          { label: 'Critical Alerts', value: stats?.critical, className: 'text-red-600' },
          { label: 'Anomaly Alerts', value: stats?.unusual, className: 'text-indigo-600' },
          { label: 'Stock Alerts', value: stats?.lowStock, className: 'text-amber-600' },
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
        <div className="p-4 border-b border-neutral-200 flex flex-col gap-4 bg-neutral-50/50">
          <div className="relative max-w-md w-full">
            <iconify-icon
              icon="solar:magnifer-linear"
              width="18"
              height="18"
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
          <div className="flex flex-wrap items-center gap-2">
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
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Categories</option>
              <option value="stock">Stock</option>
              <option value="anomaly">Anomaly</option>
              <option value="supplier">Supplier</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <ul className="divide-y divide-neutral-200" aria-label="Alerts list" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <AlertSkeleton key={index} />)
          ) : filtered.length === 0 ? (
            <li className="px-6 py-20 text-center">
              <iconify-icon icon="solar:bell-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-700">
                {(alerts ?? []).length === 0 ? 'No alerts' : 'No alerts match your filters'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {(alerts ?? []).length === 0 ? "You're all clear." : 'Try adjusting your filters or search query.'}
              </p>
              {(alerts ?? []).length > 0 && (
                <button
                  onClick={() => { setSearch(''); setSeverityFilter(''); setTypeFilter(''); }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                  Clear all filters
                </button>
              )}
            </li>
          ) : (
            filtered.map((alert) => (
              <li
                key={alert._id}
                className={`p-4 md:p-5 transition-colors ${
                  alert.status === 'open' ? 'hover:bg-neutral-50/50' : 'bg-neutral-50/40'
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1" aria-label={`${alert.severity} severity`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-medium text-neutral-900 truncate" title={alert.title}>
                        {alert.title}
                      </h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${getSeverityClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${getCategoryClass(alert.category)}`}>
                        {CATEGORY_LABELS[alert.category]}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200">
                        {TYPE_LABELS[alert.type]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${getStatusClass(alert.status)}`}>
                        {alert.status}
                      </span>
                      <time
                        className="text-xs text-neutral-500 ml-auto whitespace-nowrap"
                        dateTime={new Date(alert.createdAt).toISOString()}
                        title={new Date(alert.createdAt).toLocaleString()}
                      >
                        {timeAgo(alert.createdAt)}
                      </time>
                    </div>

                    <p className="text-sm text-neutral-600">{alert.description}</p>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] md:items-end">
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Owner
                        <select
                          value={alert.assignedTo ?? ''}
                          onChange={(e) => handleAssign(alert._id, e.target.value)}
                          disabled={assigningId === alert._id || !workspaceUsers}
                          className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60"
                        >
                          <option value="">Unassigned</option>
                          {(workspaceUsers ?? []).map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.name} ({user.role})
                            </option>
                          ))}
                        </select>
                      </label>

                      {alert.status === 'open' ? (
                        <label className="flex flex-col gap-1 text-xs text-neutral-500">
                          Resolution note
                          <input
                            type="text"
                            value={resolutionDrafts[alert._id] ?? ''}
                            onChange={(e) =>
                              setResolutionDrafts((current) => ({
                                ...current,
                                [alert._id]: e.target.value,
                              }))
                            }
                            placeholder="Add a note before resolving (optional)"
                            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                          />
                        </label>
                      ) : (
                        <div className="text-xs text-neutral-500">
                          <div className="font-medium text-neutral-700">Resolved</div>
                          <div className="mt-1">
                            {alert.resolvedByName ? `By ${alert.resolvedByName}` : 'Resolver unknown'}
                            {alert.resolvedAt ? ` • ${timeAgo(alert.resolvedAt)}` : ''}
                          </div>
                          {alert.resolutionNote ? (
                            <p className="mt-2 rounded-lg bg-white border border-neutral-200 px-3 py-2 text-sm text-neutral-600">
                              {alert.resolutionNote}
                            </p>
                          ) : null}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Link
                          href={alert.href}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          <iconify-icon icon="solar:arrow-right-up-linear" width="16" height="16" aria-hidden="true" />
                          Open record
                        </Link>
                        {alert.status === 'open' ? (
                          <button
                            onClick={() => handleResolve(alert._id)}
                            disabled={resolvingId === alert._id}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60"
                          >
                            <iconify-icon icon="solar:check-circle-linear" width="16" height="16" aria-hidden="true" />
                            {resolvingId === alert._id ? 'Resolving…' : 'Resolve'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopen(alert._id)}
                            disabled={reopeningId === alert._id}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60"
                          >
                            <iconify-icon icon="solar:refresh-linear" width="16" height="16" aria-hidden="true" />
                            {reopeningId === alert._id ? 'Reopening…' : 'Reopen'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-neutral-500">
                      {alert.assignedToName ? `Owned by ${alert.assignedToName}` : 'Unassigned'} • {alert.displayId}
                    </div>
                  </div>
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
