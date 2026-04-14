'use client';

import { useState, useMemo } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import { ProductDialog } from './components/ProductDialog';
import { RecipeEditorDialog } from './components/RecipeEditorDialog';

type Product = {
  _id: string;
  displayId: string;
  name: string;
  sku: string;
  category: 'finished_goods' | 'bundles' | 'raw_materials';
  price: number;
  cost: number;
  currentStock: number;
  isActive: boolean;
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
          <div className={`h-4 bg-surface-raised rounded-lg ${w}`} />
        </td>
      ))}
    </tr>
  );
}

function StatSkeleton() {
  return <div className="h-7 w-16 bg-surface-raised rounded-lg animate-pulse" />;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function ProductsPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const products = useQuery(
    api.products.list,
    (workspaceId && isAuthenticated) ? { workspaceId } : 'skip'
  ) as Product[] | undefined;
  const stats = useQuery(
    api.products.stats,
    (workspaceId && isAuthenticated) ? { workspaceId } : 'skip'
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Product dialog
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Recipe editor dialog
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);

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

  const openAddProduct = () => {
    setSelectedProduct(null);
    setIsProductDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDialogOpen(true);
  };

  const openRecipeEditor = (product: Product) => {
    setRecipeProduct(product);
    setIsRecipeDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Catalog &amp; Production</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">Centralized management of SKUs, pricing architecture, and BOM recipes.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            id="recipe-editor-btn"
            onClick={() => {
              if (products && products.length > 0) {
                openRecipeEditor(products[0]);
              } else {
                alert('Add a product first, then select it to edit its recipe.');
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/10 active:scale-[0.98]"
          >
            <iconify-icon icon="solar:layers-minimalistic-bold-duotone" width="18" height="18" aria-hidden="true" className="text-muted" />
            Recipe Registry
          </button>
          <button
            id="add-product-btn"
            onClick={openAddProduct}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
          >
            <iconify-icon icon="solar:add-circle-bold-duotone" width="18" height="18" aria-hidden="true" />
            Add SKU
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-accent/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-subtle/50 flex items-center justify-center text-accent border border-accent/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:box-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Total SKUs</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {stats === undefined ? <StatSkeleton /> : stats.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-success/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success-subtle/50 flex items-center justify-center text-success border border-success/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:layers-minimalistic-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">BOM Definitions</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {stats === undefined ? <StatSkeleton /> : stats.activeRecipes.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm group hover:border-danger/20 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-danger-subtle/50 flex items-center justify-center text-danger border border-danger/10 group-hover:scale-110 transition-transform" aria-hidden="true">
              <iconify-icon icon="solar:danger-triangle-bold-duotone" width="22" height="22" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Stock Deviations</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-danger">
            {products === undefined
              ? <StatSkeleton />
              : products.filter((p) => p.status !== 'In Stock').length.toLocaleString()
            }
          </div>
        </div>
      </div>

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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Filter by SKU or name…"
              aria-label="Search products"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-muted/40 text-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
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
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/10 hover:border-accent/40 transition-colors"
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
            <thead className="text-[10px] text-muted/60 font-bold uppercase tracking-widest bg-surface-raised/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4">Product Identity</th>
                <th scope="col" className="px-6 py-4">SKU / ID</th>
                <th scope="col" className="px-6 py-4">Classification</th>
                <th scope="col" className="px-6 py-4 text-right">MSRP</th>
                <th scope="col" className="px-6 py-4 text-right">Landed Cost</th>
                <th scope="col" className="px-6 py-4 text-right">Margin</th>
                <th scope="col" className="px-6 py-4 text-right">Inventory</th>
                <th scope="col" className="px-6 py-4 text-center">Protocol Status</th>
                <th scope="col" className="px-6 py-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isEmpty ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-surface-raised flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                      <iconify-icon icon="solar:box-bold-duotone" width="40" height="40" className="text-muted/20" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-bold text-foreground">Catalog Empty</p>
                    <p className="text-sm text-muted mt-2 leading-relaxed max-w-xs mx-auto">Your SKU registry is currently unpopulated. Initialize your catalog to begin operations.</p>
                    <button
                      onClick={openAddProduct}
                      className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                    >
                      <iconify-icon icon="solar:add-circle-bold-duotone" width="20" height="20" />
                      Initialize SKU
                    </button>
                  </td>
                </tr>
              ) : noResults ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted/40">
                      No matching definitions found for the current filter
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((product) => (
                  <tr key={product._id} className="hover:bg-accent-subtle/5 transition-colors group">
                    <td className="px-6 py-5 min-w-0 max-w-[240px]">
                      <div className="font-bold text-foreground truncate group-hover:text-accent transition-colors" title={product.name}>{product.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted/40 mt-1.5 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-surface-raised border border-border/50">{CATEGORY_LABELS[product.category] ?? product.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="text-muted/80 font-mono text-[10px] tracking-tight whitespace-nowrap">{product.sku}</div>
                       <div className="text-[9px] font-bold text-muted/30 uppercase tracking-[0.2em] mt-1">{product.displayId}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted/60 bg-surface-raised/50 px-2 py-1 rounded-lg border border-border/10">
                        {product.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-foreground tabular-nums whitespace-nowrap tracking-tight text-sm">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-5 text-right text-muted/60 tabular-nums whitespace-nowrap font-bold text-[10px] tracking-tight">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`tabular-nums font-black text-[10px] tracking-widest ${product.marginPct > 30 ? 'text-success' : 'text-muted'}`}>
                        {product.marginPct}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-foreground tabular-nums tracking-tight text-sm">
                      {product.currentStock.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border ${
                        product.status === 'In Stock' ? 'bg-success-subtle/50 text-success border-success/10' :
                        product.status === 'Low Stock' ? 'bg-warning-subtle/50 text-warning border-warning/10' :
                        'bg-danger-subtle/50 text-danger border-danger/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 shadow-sm ${
                          product.status === 'In Stock' ? 'bg-success' : product.status === 'Low Stock' ? 'bg-warning' : 'bg-danger'
                        }`} />
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => openRecipeEditor(product)}
                          title="BOM Configuration"
                          aria-label={`Edit recipe for ${product.name}`}
                          className="w-9 h-9 flex items-center justify-center text-muted hover:text-success hover:bg-success-subtle/30 rounded-xl transition-all active:scale-[0.9] border border-transparent hover:border-success/10"
                        >
                          <iconify-icon icon="solar:layers-minimalistic-bold-duotone" width="20" height="20" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => openEditProduct(product)}
                          title="Edit Profile"
                          aria-label={`Edit ${product.name}`}
                          className="w-9 h-9 flex items-center justify-center text-muted hover:text-accent hover:bg-accent-subtle/30 rounded-xl transition-all active:scale-[0.9] border border-transparent hover:border-accent/10"
                        >
                          <iconify-icon icon="solar:pen-bold-duotone" width="20" height="20" aria-hidden="true" />
                        </button>
                      </div>
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
              : <>Registry Index <span className="text-foreground/60">{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}</span>–<span className="text-foreground/60">{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="text-foreground/60">{filtered.length.toLocaleString()}</span> Entrances</>
            }
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center text-muted border border-border rounded-xl hover:bg-surface-raised transition-all disabled:opacity-20 active:scale-[0.95]"
                  aria-label="Previous Page"
                >
                  <iconify-icon icon="solar:alt-arrow-left-linear" width="18" height="18" />
                </button>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted/40 tabular-nums">
                  Page <span className="text-foreground/60">{page}</span> / <span className="text-foreground/60">{totalPages}</span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center text-muted border border-border rounded-xl hover:bg-surface-raised transition-all disabled:opacity-20 active:scale-[0.95]"
                  aria-label="Next Page"
                >
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" />
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>

      {/* Product Add/Edit Dialog */}
      <ProductDialog
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
        product={selectedProduct}
      />

      {/* Recipe Editor Dialog */}
      <RecipeEditorDialog
        isOpen={isRecipeDialogOpen}
        onClose={() => setIsRecipeDialogOpen(false)}
        product={recipeProduct}
      />
    </div>
  );
}
