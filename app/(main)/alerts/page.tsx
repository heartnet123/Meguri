'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
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
  return <div className="h-7 w-12 bg-surface-raised rounded animate-pulse" />;
}

function AlertSkeleton() {
  return (
    <li aria-hidden="true" className="p-6 flex gap-4 animate-pulse">
      <div className="w-10 h-10 bg-surface-raised rounded-xl shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 bg-surface-raised rounded w-1/4" />
          <div className="h-4 bg-surface-raised rounded w-16" />
          <div className="h-4 bg-surface-raised rounded w-16" />
        </div>
        <div className="h-3 bg-surface-raised rounded w-3/4" />
        <div className="h-3 bg-surface-raised rounded w-1/2" />
      </div>
    </li>
  );
}

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return <div className="w-10 h-10 rounded-xl bg-danger-subtle/30 flex items-center justify-center border border-danger/10"><iconify-icon icon="solar:danger-bold-duotone" width="22" height="22" className="text-danger" aria-hidden="true" /></div>;
    case 'high':
      return <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/10"><iconify-icon icon="solar:danger-triangle-bold-duotone" width="22" height="22" className="text-orange-500" aria-hidden="true" /></div>;
    case 'medium':
      return <div className="w-10 h-10 rounded-xl bg-warning-subtle/30 flex items-center justify-center border border-warning/10"><iconify-icon icon="solar:bell-bing-bold-duotone" width="22" height="22" className="text-warning" aria-hidden="true" /></div>;
    case 'low':
      return <div className="w-10 h-10 rounded-xl bg-accent-subtle/30 flex items-center justify-center border border-accent/10"><iconify-icon icon="solar:info-circle-bold-duotone" width="22" height="22" className="text-accent" aria-hidden="true" /></div>;
  }
}

function getSeverityClass(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return 'bg-danger-subtle text-danger border-danger/20';
    case 'high':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'medium':
      return 'bg-warning-subtle text-warning border-warning/20';
    case 'low':
      return 'bg-accent-subtle text-accent border-accent/20';
  }
}

function getCategoryClass(category: AlertCategory) {
  switch (category) {
    case 'stock':
      return 'bg-warning-subtle text-warning border-warning/20';
    case 'anomaly':
      return 'bg-accent-subtle text-accent border-accent/20';
    case 'supplier':
      return 'bg-success-subtle text-success border-success/20';
    case 'system':
      return 'bg-surface-raised text-muted border-border';
  }
}

export default function AlertsPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const args = (workspaceId && isAuthenticated) ? { workspaceId } : 'skip';
  const alerts = useQuery(api.alerts.list, args) as Alert[] | undefined;
  const stats = useQuery(api.alerts.stats, args) as AlertStats | undefined;
  const workspaceUsers = useQuery(api.users.listByWorkspace, args) as WorkspaceUser[] | undefined;

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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alert Inbox</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">
            Triage stock warnings, anomaly signals, supplier issues, and system alerts.
          </p>
        </div>
        <button
          onClick={handleResolveAll}
          disabled={resolvingAll || !hasOpenAlerts || !workspaceId}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40 active:scale-[0.98]"
        >
          <iconify-icon icon="solar:check-circle-bold-duotone" width="18" height="18" aria-hidden="true" className="text-success" />
          {resolvingAll ? 'Resolving…' : 'Resolve All Open'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Open Alerts', value: stats?.open, color: 'text-foreground', icon: 'solar:bell-bold-duotone', bg: 'bg-surface-raised/50' },
          { label: 'Critical Alerts', value: stats?.critical, color: 'text-danger', icon: 'solar:danger-bold-duotone', bg: 'bg-danger-subtle/20' },
          { label: 'Anomaly Alerts', value: stats?.unusual, color: 'text-accent', icon: 'solar:graph-up-bold-duotone', bg: 'bg-accent-subtle/20' },
          { label: 'Stock Alerts', value: stats?.lowStock, color: 'text-warning', icon: 'solar:box-bold-duotone', bg: 'bg-warning-subtle/20' },
        ].map(({ label, value, color, icon, bg }) => (
          <div key={label} className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-accent/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <iconify-icon icon={icon} width="16" height="16" className={color} />
              </div>
            </div>
            <div className={`text-2xl font-bold tabular-nums tracking-tight ${color}`}>
              {value === undefined ? <StatSkeleton /> : value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-raised/30">
          <div className="relative max-w-md w-full">
            <iconify-icon
              icon="solar:magnifer-linear"
              width="18"
              height="18"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts by title or description…"
              aria-label="Search alerts"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-muted/40 text-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter by severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
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
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
            >
              <option value="">All Categories</option>
              {Object.keys(CATEGORY_LABELS).map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat as AlertCategory]}</option>
              ))}
            </select>
          </div>
        </div>

        <ul className="divide-y divide-border" aria-label="Alerts list" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <AlertSkeleton key={index} />)
          ) : filtered.length === 0 ? (
            <li className="px-6 py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                <iconify-icon icon="solar:bell-bold-duotone" width="32" height="32" className="text-muted/40 mx-auto" aria-hidden="true" />
              </div>
              <p className="text-base font-bold text-foreground">
                {(alerts ?? []).length === 0 ? "You're all caught up!" : 'No alerts match your filters'}
              </p>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                {(alerts ?? []).length === 0 ? "No active alerts in your inbox." : 'Try adjusting your filters or search query.'}
              </p>
            </li>
          ) : (
            filtered.map((alert) => (
              <li
                key={alert._id}
                className={`p-6 transition-all border-l-4 ${
                  alert.status === 'open' 
                    ? 'border-accent bg-accent-subtle/5 hover:bg-accent-subtle/10' 
                    : 'border-transparent bg-surface opacity-80'
                }`}
              >
                <div className="flex gap-5">
                  <div className="shrink-0" aria-label={`${alert.severity} severity icon`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-bold text-foreground truncate" title={alert.title}>
                        {alert.title}
                      </h2>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getSeverityClass(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getCategoryClass(alert.category)}`}>
                          {CATEGORY_LABELS[alert.category]}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-surface-raised text-muted/60 border border-border">
                          {TYPE_LABELS[alert.type]}
                        </span>
                        {alert.status === 'resolved' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-success-subtle/50 text-success border border-success/20">
                            Resolved
                          </span>
                        )}
                      </div>
                      <time
                        className="text-[10px] font-bold uppercase tracking-widest text-muted/60 ml-auto whitespace-nowrap"
                        dateTime={new Date(alert.createdAt).toISOString()}
                        title={new Date(alert.createdAt).toLocaleString()}
                      >
                        {timeAgo(alert.createdAt)}
                      </time>
                    </div>

                    <p className="text-sm text-foreground/70 leading-relaxed font-medium max-w-3xl">{alert.description}</p>

                    <div className="grid gap-5 md:grid-cols-[240px_1fr_auto] md:items-end p-5 bg-surface-raised/40 rounded-2xl border border-border/60">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60 block px-1">Assignee</span>
                        <select
                          value={alert.assignedTo ?? ''}
                          onChange={(e) => handleAssign(alert._id, e.target.value)}
                          disabled={assigningId === alert._id || !workspaceUsers}
                          className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/10 disabled:opacity-50 transition-all"
                        >
                          <option value="">Unassigned</option>
                          {(workspaceUsers ?? []).map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.name} ({user.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      {alert.status === 'open' ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60 block px-1">Resolution Note</span>
                          <input
                            type="text"
                            value={resolutionDrafts[alert._id] ?? ''}
                            onChange={(e) =>
                              setResolutionDrafts((current) => ({
                                ...current,
                                [alert._id]: e.target.value,
                              }))
                            }
                            placeholder="Briefly explain how this was resolved…"
                            className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted/30"
                          />
                        </div>
                      ) : (
                        <div className="p-4 bg-surface border border-dashed border-border rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-success">Resolved Information</span>
                          </div>
                          <div className="text-xs text-foreground/60 font-medium">
                            {alert.resolvedByName ? `Closed by ${alert.resolvedByName}` : 'System resolved'}
                            {alert.resolvedAt ? ` • ${timeAgo(alert.resolvedAt)}` : ''}
                          </div>
                          {alert.resolutionNote && (
                            <p className="mt-2 text-sm text-foreground font-bold leading-relaxed italic border-l-2 border-border pl-3">
                              &ldquo;{alert.resolutionNote}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 md:pt-0 pt-2">
                        <Link
                          href={alert.href}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent hover:bg-accent-subtle/50 rounded-xl transition-all"
                        >
                          <iconify-icon icon="solar:arrow-right-up-bold-duotone" width="16" height="16" />
                          View Record
                        </Link>
                        {alert.status === 'open' ? (
                          <button
                            onClick={() => handleResolve(alert._id)}
                            disabled={resolvingId === alert._id}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised hover:text-success hover:border-success/20 transition-all shadow-sm active:scale-[0.98]"
                          >
                            <iconify-icon icon="solar:check-circle-bold-duotone" width="16" height="16" />
                            {resolvingId === alert._id ? 'Resolving…' : 'Resolve'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopen(alert._id)}
                            disabled={reopeningId === alert._id}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised hover:text-accent hover:border-accent/20 transition-all shadow-sm active:scale-[0.98]"
                          >
                            <iconify-icon icon="solar:refresh-bold-duotone" width="16" height="16" />
                            {reopeningId === alert._id ? 'Reopening…' : 'Reopen'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted/40 px-1">
                      <iconify-icon icon="solar:fingerprint-bold-duotone" width="12" height="12" />
                      {alert.displayId}
                      <span className="mx-1">•</span>
                      <iconify-icon icon="solar:user-bold-duotone" width="12" height="12" />
                      {alert.assignedToName ? `Owned by ${alert.assignedToName}` : 'No Owner Assigned'}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        {filtered.length > 0 && (
          <div className="p-5 border-t border-border text-center bg-surface-raised/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">
              Showing <span className="text-foreground">{filtered.length.toLocaleString()}</span> of <span className="text-foreground">{(alerts ?? []).length.toLocaleString()}</span> total alert inbox messages
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
