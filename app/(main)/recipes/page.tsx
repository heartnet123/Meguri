'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import { RecipeEditorDialog, type RecipeRow } from './components/RecipeEditorDialog';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const CATEGORY_LABELS: Record<string, string> = {
  finished_goods: 'สินค้าสำเร็จรูป',
  bundles: 'ชุดสินค้า',
  raw_materials: 'วัตถุดิบ',
};

export default function RecipesPage() {
  const workspaceId = useWorkspaceId();
  const recipes = useQuery(
    api.recipes.list,
    workspaceId ? { workspaceId } : 'skip'
  ) as RecipeRow[] | undefined;

  const removeRecipe = useMutation(api.recipes.remove);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeRow | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredRecipes = (recipes ?? []).filter((r) => {
    const s = search.toLowerCase();
    const matchesSearch = s === '' || 
      r.name.toLowerCase().includes(s) || 
      r.sku.toLowerCase().includes(s) ||
      r.displayId.toLowerCase().includes(s);
    const matchesCategory = categoryFilter === '' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: Id<'recipes'>) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้าพร้อมขายนี้?')) {
      await removeRecipe({ recipeId: id });
    }
  };

  const handleEdit = (recipe: RecipeRow) => {
    setEditingRecipe(recipe);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingRecipe(null);
    setIsEditorOpen(true);
  };

  // Stats
  const stats = {
    total: recipes?.length ?? 0,
    avgMargin: recipes?.length 
      ? Math.round(recipes.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / recipes.length) 
      : 0,
    totalValue: recipes?.reduce((sum, r) => sum + r.price, 0) ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">แคตตาล็อกและสูตรสินค้า</h1>
          <p className="text-sm text-muted mt-1">จัดการสินค้าพร้อมขาย ราคาขาย และรายการวัตถุดิบ (BOM)</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors shadow-sm"
        >
          <iconify-icon icon="solar:add-circle-linear" width="20" height="20" />
          สร้างสินค้าพร้อมขาย
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-surface border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-muted mb-2">
            <iconify-icon icon="solar:layers-minimalistic-linear" width="18" height="18" />
            <span className="text-xs font-medium uppercase tracking-wider">สินค้าทั้งหมด</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-muted mb-2">
            <iconify-icon icon="solar:chart-square-linear" width="18" height="18" />
            <span className="text-xs font-medium uppercase tracking-wider">กำไรเฉลี่ย</span>
          </div>
          <div className="text-2xl font-bold text-success">{stats.avgMargin}%</div>
        </div>
        <div className="p-4 bg-surface border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-muted mb-2">
            <iconify-icon icon="solar:dollar-minimalistic-linear" width="18" height="18" />
            <span className="text-xs font-medium uppercase tracking-wider">ราคาเฉลี่ย</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalValue / (stats.total || 1))}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <iconify-icon
            icon="solar:magnifer-linear"
            width="18" height="18"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ SKU หรือรหัสสินค้า…"
            aria-label="ค้นหาสินค้า"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">ทุกหมวดหมู่</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Main Catalog Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-raised border-b border-border">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted/70">รหัสและ SKU</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted/70">ชื่อและหมวดหมู่</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted/70">ต้นทุน</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted/70">ราคา</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted/70">กำไร</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted/70 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recipes === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-surface-raised rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredRecipes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    <iconify-icon icon="solar:ghost-linear" width="48" height="48" className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">ไม่พบสินค้าในแคตตาล็อกของคุณ</p>
                  </td>
                </tr>
              ) : (
                filteredRecipes.map((r) => (
                  <tr key={r._id} className="group hover:bg-surface-raised/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-foreground">{r.displayId}</div>
                      <div className="text-[10px] font-mono text-muted mt-0.5 uppercase tracking-tighter">{r.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{r.name}</div>
                      <div className="text-xs text-muted mt-0.5">{CATEGORY_LABELS[r.category] || r.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground tabular-nums">{formatCurrency(r.unitCost)}</div>
                      <div className="text-[10px] text-muted mt-0.5">{r.ingredientCount} วัตถุดิบ</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(r.price)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold tabular-nums ${r.marginPct >= 30 ? 'text-success' : r.marginPct >= 15 ? 'text-warning' : 'text-danger'}`}>
                        {r.marginPct}%
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">กำไร: {formatCurrency(r.price - r.unitCost)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-2 text-muted hover:text-accent hover:bg-accent-subtle rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent/20"
                          title="แก้ไขสินค้า"
                          aria-label="แก้ไข"
                        >
                          <iconify-icon icon="solar:pen-linear" width="18" height="18" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="p-2 text-muted hover:text-danger hover:bg-danger-subtle rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-danger/20"
                          title="ลบสินค้า"
                          aria-label="ลบ"
                        >
                          <iconify-icon icon="solar:trash-bin-trash-linear" width="18" height="18" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecipeEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        recipe={editingRecipe}
      />
    </div>
  );
}
