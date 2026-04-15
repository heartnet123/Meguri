'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkspaceId, useWorkspaceLoading } from '@/app/providers/WorkspaceProvider';

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
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (productId: string) => void;
  product?: Product | null;
};

const CATEGORY_OPTIONS = [
  { value: 'finished_goods', label: 'Finished Goods' },
  { value: 'bundles', label: 'Bundles' },
  { value: 'raw_materials', label: 'Raw Materials' },
] as const;

let productCounter = 1;

function generateDisplayId() {
  return `PRD-${String(productCounter++).padStart(3, '0')}`;
}

export function ProductDialog({ isOpen, onClose, onSuccess, product }: Props) {
  const workspaceId = useWorkspaceId();
  const isWorkspaceLoading = useWorkspaceLoading();
  const add = useMutation(api.products.add);
  const update = useMutation(api.products.update);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<Product['category']>('finished_goods');
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategory(product.category);
      setPrice(product.price);
      setCost(product.cost);
      setCurrentStock(product.currentStock);
      setIsActive(product.isActive);
    } else {
      setName('');
      setSku('');
      setCategory('finished_goods');
      setPrice(0);
      setCost(0);
      setCurrentStock(0);
      setIsActive(true);
    }
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWorkspaceLoading) return;

    if (!workspaceId) {
      setError('No active workspace found. Please complete onboarding or contact support.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isEdit) {
        await update({
          id: product._id as Id<'products'>,
          name,
          sku,
          category,
          price,
          cost,
          currentStock,
          isActive,
        });
        onSuccess?.(product._id);
      } else {
        const productId = await add({
          workspaceId: workspaceId as Id<'workspaces'>,
          displayId: generateDisplayId(),
          name,
          sku,
          category,
          price,
          cost,
          currentStock,
          isActive,
        });
        onSuccess?.(productId);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-dialog-title"
    >
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 id="product-dialog-title" className="text-lg font-semibold text-foreground">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted hover:text-foreground transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
              <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Name + SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  placeholder="e.g. Latte"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                  placeholder="e.g. BEV-LAT-001"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Category *</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as Product['category'])}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price + Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Selling Price *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Cost *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground bg-surface text-foreground"
                />
              </div>
            </div>

            {/* Margin preview */}
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              marginPct >= 30 ? 'bg-emerald-50 text-emerald-700' :
              marginPct >= 10 ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              <iconify-icon icon="solar:chart-2-linear" width="16" height="16" />
              <span>Estimated margin: <strong>{marginPct}%</strong></span>
            </div>

            {/* Initial stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Initial Stock {isEdit ? '(read-only)' : '*'}
                </label>
                <input
                  type="number"
                  required={!isEdit}
                  disabled={isEdit}
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground disabled:bg-surface-raised disabled:text-muted bg-surface text-foreground"
                />
              </div>
              <div className="space-y-1.5 flex flex-col justify-end pb-0.5">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent bg-surface"
                  />
                  Active Product
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-surface-raised shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading || isWorkspaceLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(loading || isWorkspaceLoading) && (
              <iconify-icon icon="solar:refresh-circle-linear" width="16" height="16" className="animate-spin" />
            )}
            {isWorkspaceLoading ? 'Syncing...' : loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
