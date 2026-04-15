'use client';

import { useState, useMemo } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

type Supplier = {
  _id: string;
  displayId: string;
  name: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  rating: number;
  status: 'active' | 'needs_review' | 'inactive';
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
};

const SKEL_WIDTHS = ['w-2/3', 'w-1/3', 'w-1/2', 'w-1/4', 'w-1/5', 'w-1/4', 'w-8'];

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
  return <div className="h-7 w-16 bg-surface-raised rounded-lg animate-pulse" />;
}

function leadTimeLabel(min: number, max: number) {
  if (min === max) return `${min} day${min !== 1 ? 's' : ''}`;
  return `${min}–${max} days`;
}

function statusLabel(status: Supplier['status']) {
  return status === 'active' ? 'Active' : status === 'needs_review' ? 'Needs Review' : 'Inactive';
}

export default function SuppliersPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const args = (workspaceId && isAuthenticated) ? { workspaceId } : 'skip';
  const suppliers = useQuery(api.suppliers.list, args) as Supplier[] | undefined;
  const stats = useQuery(api.suppliers.stats, args);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isLoading = workspaceId !== undefined && suppliers === undefined;

  const categories = useMemo(
    () => [...new Set(suppliers?.map((s) => s.category) ?? [])].sort(),
    [suppliers]
  );

  const filtered = useMemo(() => {
    if (!suppliers) return [];
    const s = search.toLowerCase();
    return suppliers.filter((sup) => {
      if (s && !sup.name.toLowerCase().includes(s) && !sup.contactName.toLowerCase().includes(s))
        return false;
      if (categoryFilter && sup.category !== categoryFilter) return false;
      if (statusFilter && sup.status !== statusFilter) return false;
      return true;
    });
  }, [suppliers, search, categoryFilter, statusFilter]);

  const isEmpty = !isLoading && (suppliers ?? []).length === 0;
  const noResults = !isLoading && (suppliers ?? []).length > 0 && filtered.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Supply Chain Network</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">Manage vendor relationships, procurement leads, and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/10 active:scale-[0.98]">
            <iconify-icon icon="solar:export-bold-duotone" width="18" height="18" aria-hidden="true" className="text-muted" />
            Export Registry
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]">
            <iconify-icon icon="solar:add-circle-bold-duotone" width="18" height="18" aria-hidden="true" />
            Enroll Vendor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-accent/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle/50 flex items-center justify-center text-accent border border-accent/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:delivery-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Total Vendors</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {stats === undefined ? <StatSkeleton /> : stats.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-success/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success-subtle/50 flex items-center justify-center text-success border border-success/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:star-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Avg Reliability</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground flex items-baseline gap-1.5">
            {stats === undefined
              ? <StatSkeleton />
              : <>{stats.avgRating}<span className="text-[10px] text-muted/40 font-black tracking-[0.2em] uppercase align-baseline">Score</span></>
            }
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-warning/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning-subtle/50 flex items-center justify-center text-warning border border-warning/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:clock-circle-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Open Fulfilments</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {stats === undefined ? <StatSkeleton /> : stats.pendingOrderCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
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
              onChange={(e) => { setSearch(e.target.value); }}
              placeholder="Search by vendor or contact…"
              aria-label="Search suppliers"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-muted/40 text-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
            >
              <option value="">All Regions</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
            >
              <option value="">All Tiers</option>
              <option value="active">Active</option>
              <option value="needs_review">Needs Review</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Suppliers list with contact information, ratings, and status</caption>
            <thead className="text-[10px] text-muted/60 font-bold uppercase tracking-widest bg-surface-raised/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4">Vendor Identity</th>
                <th scope="col" className="px-6 py-4">Commercial Tier</th>
                <th scope="col" className="px-6 py-4">Communication Details</th>
                <th scope="col" className="px-6 py-4 text-center">Fulfillment Cycle</th>
                <th scope="col" className="px-6 py-4 text-center">Trust Index</th>
                <th scope="col" className="px-6 py-4 text-center">Operational Status</th>
                <th scope="col" className="px-6 py-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-surface-raised flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                      <iconify-icon icon="solar:delivery-bold-duotone" width="40" height="40" className="text-muted/20" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-bold text-foreground">No Vendors Enrolled</p>
                    <p className="text-sm text-muted mt-2 leading-relaxed max-w-xs mx-auto">Initialize your supply chain network by adding your primary vendors.</p>
                  </td>
                </tr>
              ) : noResults ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted/40">
                      No matching vendors found for the current query
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-accent-subtle/5 transition-colors group">
                    <td className="px-6 py-5 min-w-0">
                      <div className="font-bold text-foreground max-w-[240px] truncate group-hover:text-accent transition-colors" title={supplier.name}>
                        {supplier.name}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted/40 mt-1.5 flex items-center gap-2">
                         <span className="px-1.5 py-0.5 rounded bg-surface-raised border border-border/50">{supplier.displayId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60 bg-surface-raised/50 px-2 py-1 rounded-lg border border-border/10">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 min-w-0">
                      <div className="font-bold text-foreground truncate max-w-[180px] pb-1 text-xs" title={supplier.contactName}>
                        {supplier.contactName}
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-[10px] font-medium text-muted/60 hover:text-accent flex items-center gap-2 transition-colors focus:outline-none truncate max-w-[180px]"
                          aria-label={`Email ${supplier.contactName}`}
                        >
                          <iconify-icon icon="solar:letter-bold-duotone" width="14" height="14" className="shrink-0 text-muted/20" aria-hidden="true" />
                          {supplier.email}
                        </a>
                        <a
                          href={`tel:${supplier.phone}`}
                          className="text-[10px] font-medium text-muted/60 hover:text-accent flex items-center gap-2 transition-colors focus:outline-none"
                          aria-label={`Call ${supplier.contactName}`}
                        >
                          <iconify-icon icon="solar:phone-bold-duotone" width="14" height="14" className="shrink-0 text-muted/20" aria-hidden="true" />
                          {supplier.phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="text-[10px] font-black tracking-widest text-foreground/70 uppercase">
                          {leadTimeLabel(supplier.leadTimeMinDays, supplier.leadTimeMaxDays)}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-warning group/rating">
                        <iconify-icon icon="solar:star-bold-duotone" width="16" height="16" className="group-hover/rating:scale-125 transition-transform" aria-hidden="true" />
                        <span className="font-black text-foreground tabular-nums tracking-tighter text-sm">{supplier.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border ${
                          supplier.status === 'active'
                            ? 'bg-success-subtle/50 text-success border-success/10'
                            : supplier.status === 'inactive'
                            ? 'bg-surface-raised text-muted/40 border-border/50'
                            : 'bg-warning-subtle/50 text-warning border-warning/10'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 shadow-sm ${
                          supplier.status === 'active' ? 'bg-success' : supplier.status === 'inactive' ? 'bg-muted/30' : 'bg-warning'
                        }`} />
                        {statusLabel(supplier.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="w-9 h-9 flex items-center justify-center text-muted hover:text-accent hover:bg-accent-subtle/30 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-accent/10 active:scale-[0.9] border border-transparent hover:border-accent/10"
                        aria-label={`Actions for ${supplier.name}`}
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

        <div className="p-5 border-t border-border flex items-center justify-between bg-surface-raised/30">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted/40">
            {isLoading
              ? <div className="h-4 w-40 bg-surface-raised rounded-lg animate-pulse" />
              : <>Network Index <span className="text-foreground/60">{filtered.length.toLocaleString()}</span> of <span className="text-foreground/60">{(suppliers ?? []).length.toLocaleString()}</span> Vendors Connected</>
            }
          </div>
          <div className="flex gap-2">
            <button aria-label="Previous Page" className="w-9 h-9 flex items-center justify-center text-muted border border-border rounded-xl hover:bg-surface-raised transition-all disabled:opacity-20 active:scale-[0.95]" disabled>
               <iconify-icon icon="solar:alt-arrow-left-linear" width="18" height="18" aria-hidden="true" />
            </button>
            <button aria-label="Next Page" className="w-9 h-9 flex items-center justify-center text-muted border border-border rounded-xl hover:bg-surface-raised transition-all disabled:opacity-20 active:scale-[0.95]" disabled>
               <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
