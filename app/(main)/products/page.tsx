'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

type Product = {
  _id: string;
  displayId: string;
  name: string;
  sku: string;
  category: 'finished_goods' | 'bundles' | 'raw_materials';
  price: number;
  cost: number;
  currentStock: number;
  marginPct: number;
  status: 'In Stock' | 'Low Stock' | 'Critical';
};

const CATEGORY_LABELS: Record<Product['category'], string> = {
  finished_goods: 'Finished Goods',
  bundles: 'Bundles',
  raw_materials: 'Raw Materials',
};

const PER_PAGE = 20;
const SKEL_WIDTHS = ['w-2/3', 'w-1/4', 'w-1/3', 'w-1/5', 'w-1/5', 'w-1/6', 'w-1/6', 'w-1/5', 'w-8'];

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

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function ProductsPage() {
  const { workspaceId, workspaceValidated } = useWorkspace();
  const products = useQuery(
    api.products.list,
    workspaceId && workspaceValidated ? { workspaceId } : 'skip'
  ) as Product[] | undefined;
  const stats = useQuery(
    api.products.stats,
    workspaceId && workspaceValidated ? { workspaceId } : 'skip'
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const isLoading = workspaceId !== undefined && products === undefined;

  const filtered = useMemo(() => {
    if (!products) return [];
    const s = search.toLowerCase();
    return products.filter((p) => {
      if (s && !p.name.toLowerCase().includes(s) && !p.sku.toLowerCase().includes(s)) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const isEmpty = !isLoading && (products ?? []).length === 0;
  const noResults = !isLoading && (products ?? []).length > 0 && filtered.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Products &amp; Recipes</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your products, ingredients, and production recipes.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <iconify-icon icon="solar:layers-minimalistic-linear" width="18" height="18" aria-hidden="true" />
            Recipe Editor
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18" aria-hidden="true" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600" aria-hidden="true">
              <iconify-icon icon="solar:box-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Total Products</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined ? <StatSkeleton /> : stats.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600" aria-hidden="true">
              <iconify-icon icon="solar:layers-minimalistic-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Active Recipes</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined ? <StatSkeleton /> : stats.activeRecipes.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600" aria-hidden="true">
              <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Critical / Low Stock</h3>
          </div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {products === undefined
              ? <StatSkeleton />
              : products.filter((p) => p.status !== 'In Stock').length.toLocaleString()
            }
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
              placeholder="Search products, SKUs…"
              aria-label="Search products"
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:border-neutral-900 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Products list with pricing, margin, and stock status</caption>
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Product Name</th>
                <th scope="col" className="px-6 py-3 font-medium">SKU</th>
                <th scope="col" className="px-6 py-3 font-medium">Category</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Price</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Cost</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Margin</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Stock</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <iconify-icon icon="solar:box-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
                    <p className="text-sm font-medium text-neutral-700">No products yet</p>
                    <p className="text-xs text-neutral-500 mt-1">Add your first product to get started.</p>
                  </td>
                </tr>
              ) : noResults ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-neutral-500">
                    No products match your search.
                  </td>
                </tr>
              ) : (
                pageItems.map((product) => (
                  <tr key={product._id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4 min-w-0 max-w-[200px]">
                      <div className="font-medium text-neutral-900 truncate" title={product.name}>{product.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{product.displayId}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 font-mono text-xs whitespace-nowrap">{product.sku}</td>
                    <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-600 tabular-nums whitespace-nowrap">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-600 tabular-nums whitespace-nowrap">
                      {product.marginPct}%
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900 tabular-nums">
                      {product.currentStock.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                        product.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                        product.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                        'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                        aria-label={`Actions for ${product.name}`}
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
              : `Showing ${Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length.toLocaleString()} products`
            }
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-100 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >Previous</button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-100 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >Next</button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
