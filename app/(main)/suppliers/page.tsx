import type { Id } from "@/convex/_generated/dataModel";
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
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
          <div className={`h-4 bg-neutral-100 rounded ${w}`} />
        </td>
      ))}
    </tr>
  );
}

function StatSkeleton() {
  return <div className="h-7 w-16 bg-neutral-100 rounded animate-pulse" />;
}

function leadTimeLabel(min: number, max: number) {
  if (min === max) return `${min} day${min !== 1 ? 's' : ''}`;
  return `${min}–${max} days`;
}

function statusLabel(status: Supplier['status']) {
  return status === 'active' ? 'Active' : status === 'needs_review' ? 'Needs Review' : 'Inactive';
}

export default function SuppliersPage() {
  const workspaceId = useWorkspaceId();
  const suppliers = useQuery(
    api.suppliers.list,
    workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  ) as Supplier[] | undefined;
  const stats = useQuery(
    api.suppliers.stats,
    workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  );

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Suppliers</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your suppliers, track performance, and view contact details.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <iconify-icon icon="solar:export-linear" width="18" height="18" aria-hidden="true" />
            Export List
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18" aria-hidden="true" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600" aria-hidden="true">
              <iconify-icon icon="solar:delivery-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Total Suppliers</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined ? <StatSkeleton /> : stats.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600" aria-hidden="true">
              <iconify-icon icon="solar:star-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Average Rating</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined
              ? <StatSkeleton />
              : <>{stats.avgRating}<span className="text-base text-neutral-500 font-normal">/5.0</span></>
            }
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600" aria-hidden="true">
              <iconify-icon icon="solar:clock-circle-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Pending Orders</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined ? <StatSkeleton /> : stats.pendingOrderCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
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
              onChange={(e) => { setSearch(e.target.value); }}
              placeholder="Search suppliers, contacts…"
              aria-label="Search suppliers"
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:border-neutral-900 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="needs_review">Needs Review</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Suppliers list with contact information, ratings, and status</caption>
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Supplier Name</th>
                <th scope="col" className="px-6 py-3 font-medium">Category</th>
                <th scope="col" className="px-6 py-3 font-medium">Contact Info</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Lead Time</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Rating</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <iconify-icon icon="solar:delivery-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
                    <p className="text-sm font-medium text-neutral-700">No suppliers yet</p>
                    <p className="text-xs text-neutral-500 mt-1">Add your first supplier to get started.</p>
                  </td>
                </tr>
              ) : noResults ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-neutral-500">
                    No suppliers match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 min-w-0">
                      <div className="font-medium text-neutral-900 max-w-[200px] truncate" title={supplier.name}>
                        {supplier.name}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">{supplier.displayId}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 max-w-[140px]">
                      <span className="block truncate" title={supplier.category}>{supplier.category}</span>
                    </td>
                    <td className="px-6 py-4 min-w-0">
                      <div className="font-medium text-neutral-900 truncate max-w-[160px]" title={supplier.contactName}>
                        {supplier.contactName}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-xs text-neutral-500 hover:text-teal-600 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded min-w-0"
                          aria-label={`Email ${supplier.contactName}`}
                        >
                          <iconify-icon icon="solar:letter-linear" width="12" height="12" className="shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[140px]">{supplier.email}</span>
                        </a>
                        <a
                          href={`tel:${supplier.phone}`}
                          className="text-xs text-neutral-500 hover:text-teal-600 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded"
                          aria-label={`Call ${supplier.contactName}`}
                        >
                          <iconify-icon icon="solar:phone-linear" width="12" height="12" className="shrink-0" aria-hidden="true" />
                          <span className="whitespace-nowrap">{supplier.phone}</span>
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-600 whitespace-nowrap">
                      {leadTimeLabel(supplier.leadTimeMinDays, supplier.leadTimeMaxDays)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-500">
                        <iconify-icon icon="solar:star-bold" width="16" height="16" aria-hidden="true" />
                        <span className="font-medium text-neutral-900">{supplier.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                          supplier.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                            : supplier.status === 'inactive'
                            ? 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200'
                            : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                        }`}
                      >
                        {statusLabel(supplier.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                        aria-label={`Actions for ${supplier.name}`}
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
              ? <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
              : `Showing ${filtered.length.toLocaleString()} of ${(suppliers ?? []).length.toLocaleString()} suppliers`
            }
          </div>
        </div>
      </div>
    </div>
  );
}
