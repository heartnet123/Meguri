'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';

/* ─── Types ────────────────────────────────────────────────────────────────── */

type RecipeItem = {
  _id: Id<'recipes'>;
  displayId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  unitCost: number;
  marginPct: number;
  isActive: boolean;
};

type CartItem = {
  recipeId: Id<'recipes'>;
  name: string;
  price: number;
  cost: number;
  quantity: number;
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatCurrency(n: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n);
}

function generateDisplayId() {
  return `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  finished_goods: 'สินค้าสำเร็จรูป',
  bundles: 'ชุดสินค้า',
  raw_materials: 'วัตถุดิบ',
};

const PAYMENT_OPTIONS = [
  { value: 'cash' as const, label: 'เงินสด', icon: 'solar:wallet-money-linear' },
  { value: 'credit_card' as const, label: 'บัตรเครดิต', icon: 'solar:card-linear' },
  { value: 'mobile_pay' as const, label: 'มือถือ', icon: 'solar:smartphone-2-linear' },
  { value: 'invoice' as const, label: 'ใบแจ้งหนี้', icon: 'solar:document-text-linear' },
];

/* ─── CustomDropdown ───────────────────────────────────────────────────────── */

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label : placeholder;

  return (
    <div className="relative min-w-max" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-4 px-3 py-2 text-sm bg-white border rounded-md border-neutral-200 text-neutral-800 hover:border-neutral-300 focus:outline-none focus-visible:border-neutral-900 transition-colors"
      >
        <span className={value ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
          {selectedLabel}
        </span>
        <iconify-icon icon="solar:alt-arrow-down-linear" width="16" height="16" className="text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-sm border-neutral-200 py-1 max-h-60 overflow-auto">
          <button
            onClick={() => { onChange(''); setIsOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-neutral-50 text-neutral-900 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function NewOrderPage() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const recipes = useQuery(
    api.recipes.list,
    workspaceId ? { workspaceId } : 'skip'
  ) as RecipeItem[] | undefined;

  const addSale = useMutation(api.sales.add);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customer, setCustomer] = useState('ลูกค้าทั่วไป');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'mobile_pay' | 'invoice'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build the preview query args from cart
  const previewArgs = useMemo(() => {
    if (!workspaceId || cart.length === 0) return 'skip' as const;
    return {
      workspaceId,
      items: cart.map((c) => ({ recipeId: c.recipeId, quantity: c.quantity })),
    };
  }, [workspaceId, cart]);

  const impact = useQuery(api.sales.getImpactPreview, previewArgs);

  // Filter recipes for the grid
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    const s = search.toLowerCase();
    return recipes.filter((p) => {
      if (!p.isActive) return false;
      if (s && !p.name.toLowerCase().includes(s) && !p.sku.toLowerCase().includes(s)) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      return true;
    });
  }, [recipes, search, categoryFilter]);

  // Cart operations
  const addToCart = useCallback((recipe: RecipeItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.recipeId === recipe._id);
      if (existing) {
        return prev.map((c) =>
          c.recipeId === recipe._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        recipeId: recipe._id,
        name: recipe.name,
        price: recipe.price,
        cost: recipe.unitCost,
        quantity: 1,
      }];
    });
    setError(null);
  }, []);

  const updateQuantity = useCallback((recipeId: Id<'recipes'>, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.recipeId !== recipeId));
    } else {
      setCart((prev) => prev.map((c) =>
        c.recipeId === recipeId ? { ...c, quantity } : c
      ));
    }
    setError(null);
  }, []);

  const removeFromCart = useCallback((recipeId: Id<'recipes'>) => {
    setCart((prev) => prev.filter((c) => c.recipeId !== recipeId));
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
    return impact.ingredientImpacts.some((i: any) => i.insufficient);
  }, [impact]);

  // Checkout handler
  const handleCheckout = async () => {
    if (!workspaceId || cart.length === 0) return;
    if (hasInsufficientStock) {
      setError('ไม่สามารถทำรายการได้ — วัตถุดิบบางรายการมีสต็อกไม่เพียงพอ');
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
          kind: 'recipe' as const,
          recipeId: c.recipeId,
          quantity: c.quantity,
          unitPrice: c.price,
        })),
      });
      router.push('/sales');
    } catch (err: any) {
      setError(err.message || 'ทำรายการขายไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = workspaceId !== undefined && recipes === undefined;
  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="max-w-full mx-auto space-y-0">

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="p-2 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none"
            aria-label="กลับไปหน้าขาย"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="20" height="20" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">รายการขายใหม่</h1>
            <p className="text-sm text-neutral-500 mt-0.5">เลือกสินค้าจากแคตตาล็อก ระบบจะตัดสต็อกตามสูตรสินค้าอัตโนมัติ</p>
          </div>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors focus:outline-none"
          >
ล้างตะกร้า
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── Left: Recipe Catalog ─────────────────────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <iconify-icon
                icon="solar:magnifer-linear" width="16" height="16"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาตามชื่อหรือ SKU…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border border-neutral-200 rounded-md focus:outline-none focus-visible:border-neutral-900 transition-colors placeholder:text-neutral-400"
              />
            </div>
            <CustomDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              placeholder="ทุกหมวดหมู่"
            />
          </div>

          {/* Catalog Grid */}
          <div
            className="grid grid-cols-2 xl:grid-cols-3 gap-3 content-start"
            aria-busy={isLoading}
            aria-live="polite"
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-neutral-100 rounded-md p-4 animate-pulse">
                  <div className="h-3 bg-neutral-100 rounded-sm w-3/4 mb-3" />
                  <div className="h-2 bg-neutral-100 rounded-sm w-1/2 mb-6" />
                  <div className="h-4 bg-neutral-100 rounded-sm w-1/3" />
                </div>
              ))
            ) : filteredRecipes.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-dashed border-neutral-200 rounded-md">
                <p className="text-sm font-medium text-neutral-500">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                <p className="text-xs text-neutral-400 mt-1">ลองปรับคำค้นหาหรือตัวกรอง</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => {
                const inCart = cart.find((c) => c.recipeId === recipe._id);
                return (
                  <button
                    key={recipe._id}
                    onClick={() => addToCart(recipe)}
                    className={`group relative bg-white border rounded-md p-4 text-left transition-all focus:outline-none flex flex-col justify-between min-h-[110px] ${
                      inCart
                        ? 'border-neutral-400 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {/* Top: name, SKU, in-cart badge */}
                    <div className="w-full">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium text-neutral-900 text-sm tracking-tight leading-snug">
                          {recipe.name}
                        </div>
                        {inCart && (
                          <span className="shrink-0 bg-neutral-900 text-white text-xs font-medium px-1.5 py-0.5 rounded-sm">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1 font-mono">{recipe.sku}</div>
                    </div>

                    {/* Bottom: price + hover hint */}
                    <div className="flex items-end justify-between w-full mt-4">
                      <span className="text-sm font-medium text-neutral-900 tabular-nums">
                        {formatCurrency(recipe.price)}
                      </span>
                      <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <iconify-icon icon="solar:add-circle-linear" width="14" height="14" aria-hidden="true" />
เพิ่ม
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Right: Cart + Impact + Checkout ──────────────────────────────── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">

          {/* Customer & Payment */}
          <div className="bg-white border border-neutral-200 rounded-md p-4 space-y-5">
            <div>
              <label htmlFor="customer-name" className="text-xs text-neutral-500 mb-1.5 block">
                ลูกค้า
              </label>
              <input
                id="customer-name"
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-neutral-200 rounded-md focus:outline-none focus-visible:border-neutral-900 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">วิธีชำระเงิน</label>
              <div className="flex bg-neutral-50 border border-neutral-200 rounded-md p-1">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs rounded-sm transition-colors focus:outline-none ${
                      paymentMethod === opt.value
                        ? 'bg-white shadow-sm border border-neutral-200/50 text-neutral-900 font-medium'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <iconify-icon icon={opt.icon} width="16" height="16" aria-hidden="true" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart — Line Items */}
          <div className="bg-white border border-neutral-200 rounded-md flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900">รายการในตะกร้า</h2>
              <span className="text-xs text-neutral-500">{cartTotals.itemCount} ชิ้น</span>
            </div>

            {cart.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-neutral-400">ตะกร้ายังว่างอยู่</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.recipeId} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-sm font-medium text-neutral-900 truncate tracking-tight">
                        {item.name}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-neutral-200 rounded-sm bg-neutral-50">
                        <button
                          onClick={() => updateQuantity(item.recipeId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors focus:outline-none"
                          aria-label="ลดจำนวน"
                        >
                          <iconify-icon icon="solar:minus-linear" width="12" height="12" aria-hidden="true" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.recipeId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors focus:outline-none"
                          aria-label="เพิ่มจำนวน"
                        >
                          <iconify-icon icon="solar:add-linear" width="12" height="12" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="text-sm font-medium tabular-nums w-14 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ledger Totals */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>ยอดย่อย</span>
                  <span className="tabular-nums">{formatCurrency(cartTotals.revenue)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>ต้นทุนโดยประมาณ</span>
                  <span className="tabular-nums">{formatCurrency(cartTotals.cost)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 mt-1 border-t border-neutral-200 text-neutral-900">
                  <span>ยอดรวม</span>
                  <span className="tabular-nums">{formatCurrency(cartTotals.revenue)}</span>
                </div>
              </div>
            )}
          </div>

          {/* BOM Stock Impact */}
          {cart.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100">
                <h2 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <iconify-icon icon="solar:danger-triangle-linear" width="14" height="14" aria-hidden="true" />
ผลกระทบต่อสต็อกจากสูตรสินค้า
                </h2>
              </div>

              {!impact ? (
                <div className="px-4 py-6 text-center">
                  <div className="h-3 w-40 bg-neutral-100 rounded-sm animate-pulse mx-auto" />
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                  {impact.ingredientImpacts.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-neutral-500 text-center">
ไม่พบวัตถุดิบของรายการเหล่านี้
                    </div>
                  ) : (
                    impact.ingredientImpacts.map((item: any) => (
                      <div
                        key={item.inventoryItemId}
                        className={`px-4 py-2.5 flex items-center justify-between text-xs ${item.insufficient ? 'bg-red-50' : ''}`}
                      >
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
                    ))
                  )}
                </div>
              )}

              {hasInsufficientStock && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-200">
                  <p className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                    <iconify-icon icon="solar:danger-circle-linear" width="14" height="14" aria-hidden="true" />
วัตถุดิบไม่เพียงพอ — โปรดตรวจสอบระดับสต็อก
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-white border border-neutral-200 rounded-md px-4 py-3 flex items-start gap-2">
              <iconify-icon
                icon="solar:danger-triangle-linear" width="16" height="16"
                className="text-neutral-900 shrink-0 mt-0.5" aria-hidden="true"
              />
              <p className="text-xs text-neutral-900 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting || hasInsufficientStock}
            className="w-full py-3.5 px-4 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <iconify-icon icon="solar:refresh-linear" width="16" height="16" className="animate-spin" aria-hidden="true" />
กำลังดำเนินการ…
              </>
            ) : (
              <span>เรียกเก็บ {formatCurrency(cartTotals.revenue)}</span>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
