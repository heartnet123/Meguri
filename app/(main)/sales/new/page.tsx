'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';

/* ─── Types ────────────────────────────────────────────────────────────────── */

type Product = {
  _id: Id<'products'>;
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

type CartItem = {
  productId: Id<'products'>;
  name: string;
  price: number;
  cost: number;
  quantity: number;
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function generateDisplayId() {
  return `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
}

const CATEGORY_LABELS: Record<Product['category'], string> = {
  finished_goods: 'Finished Goods',
  bundles: 'Bundles',
  raw_materials: 'Raw Materials',
};

const PAYMENT_OPTIONS = [
  { value: 'cash' as const, label: 'Cash', icon: 'solar:wallet-money-linear' },
  { value: 'credit_card' as const, label: 'Credit Card', icon: 'solar:card-linear' },
  { value: 'mobile_pay' as const, label: 'Mobile Pay', icon: 'solar:smartphone-2-linear' },
  { value: 'invoice' as const, label: 'Invoice', icon: 'solar:document-text-linear' },
];

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function NewOrderPage() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const products = useQuery(
    api.products.list,
    workspaceId ? { workspaceId } : 'skip'
  ) as Product[] | undefined;

  const addSale = useMutation(api.sales.add);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customer, setCustomer] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'mobile_pay' | 'invoice'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build the preview query args from cart
  const previewArgs = useMemo(() => {
    if (!workspaceId || cart.length === 0) return 'skip' as const;
    return {
      workspaceId,
      items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
    };
  }, [workspaceId, cart]);

  const impact = useQuery(api.sales.getImpactPreview, previewArgs);

  // Filter products for the grid
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const s = search.toLowerCase();
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (s && !p.name.toLowerCase().includes(s) && !p.sku.toLowerCase().includes(s)) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      return true;
    });
  }, [products, search, categoryFilter]);

  // Cart operations
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product._id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        price: product.price,
        cost: product.cost,
        quantity: 1,
      }];
    });
    setError(null);
  }, []);

  const updateQuantity = useCallback((productId: Id<'products'>, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.productId !== productId));
    } else {
      setCart((prev) => prev.map((c) =>
        c.productId === productId ? { ...c, quantity } : c
      ));
    }
    setError(null);
  }, []);

  const removeFromCart = useCallback((productId: Id<'products'>) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
    setError(null);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setError(null);
  }, []);

  // Cart totals (local computation)
  const cartTotals = useMemo(() => {
    const revenue = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    const cost = cart.reduce((s, c) => s + c.cost * c.quantity, 0);
    const margin = revenue - cost;
    const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
    const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
    return { revenue, cost, margin, marginPct, itemCount };
  }, [cart]);

  // Check if any item has insufficient stock
  const hasInsufficientStock = useMemo(() => {
    if (!impact) return false;
    return (
      impact.ingredientImpacts.some((i: any) => i.insufficient) ||
      impact.productImpacts.some((i: any) => i.insufficient)
    );
  }, [impact]);

  // Checkout handler
  const handleCheckout = async () => {
    if (!workspaceId || cart.length === 0) return;
    if (hasInsufficientStock) {
      setError('Cannot complete order — some items have insufficient stock.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addSale({
        workspaceId,
        displayId: generateDisplayId(),
        customer,
        itemCount: cartTotals.itemCount,
        totalAmount: cartTotals.revenue,
        paymentMethod,
        status: 'completed',
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.price,
        })),
      });
      router.push('/sales');
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = workspaceId !== undefined && products === undefined;

  return (
    <div className="max-w-full mx-auto space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            aria-label="Back to sales"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="20" height="20" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">New Order</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Select products, review stock impact, and complete the sale.</p>
          </div>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-neutral-500 hover:text-red-600 transition-colors focus:outline-none"
          >
            Clear cart
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── Left: Product Catalog ─────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <iconify-icon
                icon="solar:magnifer-linear" width="18" height="18"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:border-neutral-900 transition-all bg-white"
              />
            </div>
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3" aria-busy={isLoading} aria-live="polite">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-neutral-100 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2 mb-4" />
                  <div className="h-6 bg-neutral-100 rounded w-1/3" />
                </div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <iconify-icon icon="solar:box-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
                <p className="text-sm font-medium text-neutral-700">No products found</p>
                <p className="text-xs text-neutral-500 mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.productId === product._id);
                return (
                  <button
                    key={product._id}
                    onClick={() => addToCart(product)}
                    className={`group relative bg-white border rounded-xl p-4 text-left transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                      inCart ? 'border-teal-300 ring-1 ring-teal-200' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="font-medium text-neutral-900 text-sm truncate" title={product.name}>
                      {product.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5 font-mono">{product.sku}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-semibold text-neutral-900 tabular-nums">
                        {formatCurrency(product.price)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        product.marginPct >= 50 ? 'bg-emerald-50 text-emerald-700' :
                        product.marginPct >= 25 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {product.marginPct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-neutral-500">
                        Stock: {product.currentStock}
                      </span>
                      <span className={`text-xs font-medium ${
                        product.status === 'In Stock' ? 'text-emerald-600' :
                        product.status === 'Low Stock' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Right: Cart + Impact + Checkout ────────────── */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Customer + Payment */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
            <div>
              <label htmlFor="customer-name" className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Customer</label>
              <input
                id="customer-name"
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Payment Method</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                      paymentMethod === opt.value
                        ? 'border-teal-300 bg-teal-50 text-teal-700 font-medium'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <iconify-icon icon={opt.icon} width="16" height="16" aria-hidden="true" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50">
              <h2 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                <iconify-icon icon="solar:cart-large-linear" width="16" height="16" aria-hidden="true" />
                Cart
                {cart.length > 0 && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                    {cartTotals.itemCount} items
                  </span>
                )}
              </h2>
            </div>

            {cart.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <iconify-icon icon="solar:cart-large-linear" width="28" height="28" className="text-neutral-300 mx-auto mb-2 block" aria-hidden="true" />
                <p className="text-sm text-neutral-500">Click products to add them here</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900 truncate">{item.name}</div>
                      <div className="text-xs text-neutral-500">
                        {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <iconify-icon icon="solar:trash-bin-minimalistic-linear" width="14" height="14" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Margin Summary */}
            {cart.length > 0 && (
              <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50/30 space-y-1.5">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium tabular-nums">{formatCurrency(cartTotals.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>COGS</span>
                  <span className="tabular-nums">{formatCurrency(cartTotals.cost)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-1.5 border-t border-neutral-100">
                  <span className="text-neutral-900">Gross Margin</span>
                  <span className={`tabular-nums ${cartTotals.marginPct >= 30 ? 'text-emerald-700' : cartTotals.marginPct >= 15 ? 'text-amber-700' : 'text-red-700'}`}>
                    {formatCurrency(cartTotals.margin)} ({cartTotals.marginPct}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stock Impact Preview */}
          {cart.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50">
                <h2 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" aria-hidden="true" />
                  Stock Impact Preview
                </h2>
              </div>

              {!impact ? (
                <div className="px-4 py-6 text-center">
                  <div className="h-4 w-48 bg-neutral-100 rounded animate-pulse mx-auto" />
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                  {impact.ingredientImpacts.length === 0 && impact.productImpacts.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-neutral-500 text-center">No stock deductions for this order.</div>
                  ) : (
                    <>
                      {impact.ingredientImpacts.map((item: any) => (
                        <div key={item.inventoryItemId} className={`px-4 py-2.5 flex items-center justify-between text-xs ${item.insufficient ? 'bg-red-50' : ''}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.insufficient ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className={`font-medium truncate ${item.insufficient ? 'text-red-700' : 'text-neutral-900'}`}>
                              {item.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <span className="text-neutral-500">{item.currentStock}</span>
                            <span className="text-neutral-400 mx-1">→</span>
                            <span className="text-red-600 font-medium">−{item.deduction}</span>
                            <span className="text-neutral-400 mx-1">=</span>
                            <span className={`font-semibold ${item.insufficient ? 'text-red-700' : 'text-neutral-900'}`}>
                              {item.remainingStock} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                      {impact.productImpacts.map((item: any) => (
                        <div key={item.productId} className={`px-4 py-2.5 flex items-center justify-between text-xs ${item.insufficient ? 'bg-red-50' : ''}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.insufficient ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className={`font-medium truncate ${item.insufficient ? 'text-red-700' : 'text-neutral-900'}`}>
                              {item.name} (direct)
                            </span>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <span className="text-neutral-500">{item.currentStock}</span>
                            <span className="text-neutral-400 mx-1">→</span>
                            <span className="text-red-600 font-medium">−{item.deduction}</span>
                            <span className="text-neutral-400 mx-1">=</span>
                            <span className={`font-semibold ${item.insufficient ? 'text-red-700' : 'text-neutral-900'}`}>
                              {item.remainingStock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {hasInsufficientStock && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-200">
                  <p className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                    <iconify-icon icon="solar:danger-circle-linear" width="14" height="14" aria-hidden="true" />
                    Insufficient stock — this order cannot be completed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting || hasInsufficientStock}
            className="w-full py-3.5 px-4 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <iconify-icon icon="solar:loading-linear" width="18" height="18" className="animate-spin" aria-hidden="true" />
                Processing…
              </>
            ) : (
              <>
                <iconify-icon icon="solar:check-circle-linear" width="18" height="18" aria-hidden="true" />
                Complete Sale — {formatCurrency(cartTotals.revenue)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
