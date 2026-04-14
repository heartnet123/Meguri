'use client';

import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

type Recommendation = {
  _id: Id<'reorderRecommendations'>;
  recommendedQty: number;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
  status: 'pending' | 'accepted' | 'dismissed';
  item: {
    name: string;
    sku: string;
    currentStock: number;
    unit: string;
  } | null;
  supplier: { name: string } | null;
};

function CardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-surface border border-border rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-5">
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-surface-raised rounded-lg w-1/3" />
          <div className="h-4 bg-surface-raised rounded-lg w-1/4" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-6 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-surface-raised rounded w-2/3" />
            <div className="h-5 bg-surface-raised rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="h-12 bg-surface-raised rounded-xl" />
    </div>
  );
}

export default function PurchasePlanningPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const recs = useQuery(
    api.purchasePlanning.recommendations,
    (workspaceId && isAuthenticated) ? { workspaceId } : 'skip'
  ) as Recommendation[] | undefined;

  const accept = useMutation(api.purchasePlanning.accept);
  const dismiss = useMutation(api.purchasePlanning.dismiss);

  const [accepting, setAccepting] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const isLoading = workspaceId !== undefined && recs === undefined;

  const high = recs?.filter((r) => r.urgency === 'high') ?? [];
  const medium = recs?.filter((r) => r.urgency !== 'high') ?? [];

  async function handleAccept(id: Id<'reorderRecommendations'>) {
    setAccepting(id);
    try { await accept({ id }); } finally { setAccepting(null); }
  }

  async function handleDismiss(id: Id<'reorderRecommendations'>) {
    setDismissing(id);
    try { await dismiss({ id }); } finally { setDismissing(null); }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Purchase Planning</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">AI-driven reorder recommendations and draft orders.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground bg-surface border border-border rounded-xl hover:bg-surface-raised transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20 active:scale-[0.98]">
          <iconify-icon icon="solar:document-text-bold-duotone" width="18" height="18" aria-hidden="true" />
          View Draft Orders
        </button>
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-br from-accent/90 via-accent to-accent-light/80 rounded-3xl p-8 text-white shadow-2xl shadow-accent/20 flex flex-col md:flex-row items-center md:items-start gap-6 overflow-hidden relative group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="p-4 bg-white/10 rounded-2xl shrink-0 backdrop-blur-xl border border-white/20 group-hover:rotate-12 transition-transform duration-500">
          <iconify-icon icon="solar:stars-bold-duotone" width="36" height="36" aria-hidden="true" />
        </div>
        <div className="min-w-0 relative z-10 text-center md:text-left">
          <h2 className="text-xl font-bold mb-2 tracking-tight">Intelligent Stock Optimization</h2>
          <p className="text-white/90 text-sm leading-relaxed max-w-2xl font-medium">
            Our predictive engine processed your recent velocity and supplier history.
            Approve recommendations below to automatically populate draft purchase orders and maintain 99.9% service levels.
          </p>
        </div>
        <div className="flex-1" />
        <div className="hidden lg:flex flex-col items-end shrink-0 gap-1.5 opacity-80">
          <span className="text-[10px] font-bold uppercase tracking-widest">Model Version</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold">SMART-STOCK-V4</span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <div className="h-5 w-40 bg-surface-raised rounded-full animate-pulse" />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (recs ?? []).length === 0 && (
        <div className="bg-surface border border-border rounded-3xl shadow-sm p-20 text-center">
          <div className="w-20 h-20 bg-surface-raised rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-border shadow-inner group transition-transform hover:scale-105 duration-500">
            <iconify-icon icon="solar:cart-large-bold-duotone" width="40" height="40" className="text-muted/30 group-hover:text-accent/40 transition-colors" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold text-foreground mb-1.5 tracking-tight">Stock Levels Nominal</p>
          <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">AI monitoring suggests all inventory is currently within safety margins. No reorders required.</p>
        </div>
      )}

      {/* High urgency */}
      {!isLoading && high.length > 0 && (
        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-6 h-6 rounded-full bg-danger-subtle border border-danger/10">
               <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
             </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Critical Shortfalls</h2>
          </div>
          <div className="grid grid-cols-1 gap-5">
            {high.map((rec) => (
              <ReorderCard
                key={rec._id}
                rec={rec}
                accepting={accepting === rec._id}
                dismissing={dismissing === rec._id}
                onAccept={() => handleAccept(rec._id)}
                onDismiss={() => handleDismiss(rec._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium urgency */}
      {!isLoading && medium.length > 0 && (
        <div className="space-y-5 pt-4 animate-in slide-in-from-bottom-6 duration-1000">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-6 h-6 rounded-full bg-warning-subtle border border-warning/10">
               <span className="w-2 h-2 rounded-full bg-warning" />
             </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Strategic Replenishment</h2>
          </div>
          <div className="grid grid-cols-1 gap-5">
            {medium.map((rec) => (
              <ReorderCard
                key={rec._id}
                rec={rec}
                accepting={accepting === rec._id}
                dismissing={dismissing === rec._id}
                onAccept={() => handleAccept(rec._id)}
                onDismiss={() => handleDismiss(rec._id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReorderCard({
  rec,
  accepting,
  dismissing,
  onAccept,
  onDismiss,
}: {
  rec: Recommendation;
  accepting: boolean;
  dismissing: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const isHigh = rec.urgency === 'high';
  const itemName = rec.item?.name ?? 'Unknown Item';
  const itemSku = rec.item?.sku ?? '—';
  const supplierName = rec.supplier?.name ?? 'Unknown Supplier';
  const currentStock = rec.item ? `${rec.item.currentStock.toLocaleString()} ${rec.item.unit}` : '—';
  const recommendedQty = `${rec.recommendedQty.toLocaleString()}${rec.item?.unit ? ` ${rec.item.unit}` : ''}`;

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm p-1 hover:border-accent/30 transition-all group active:scale-[0.995]">
      <div className="p-6 flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-5 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h3 className="text-lg font-bold text-foreground truncate tracking-tight group-hover:text-accent transition-colors" title={itemName}>
                  {itemName}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  isHigh
                    ? 'bg-danger-subtle/50 text-danger border-danger/20'
                    : 'bg-warning-subtle/50 text-warning border-warning/20'
                }`}>
                  {isHigh ? 'High Priority' : 'Routine'}
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 truncate flex items-center gap-2">
                <span className="text-muted/40 font-medium">SKU:</span> {itemSku} 
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-muted/40 font-medium">Supplier:</span> <span className="text-foreground/70">{supplierName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted/50 mb-1">On-Hand Inventory</div>
              <div className="text-base font-bold text-foreground tabular-nums tracking-tight">{currentStock}</div>
            </div>
            <div className="bg-accent-subtle/50 p-3 px-4 rounded-xl border border-accent/10 transition-colors group-hover:bg-accent-subtle">
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">AI Recommendation</div>
              <div className="text-xl font-black text-accent tabular-nums tracking-tighter">
                + {recommendedQty}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 text-sm text-foreground/70 bg-surface-raised/50 p-5 rounded-2xl border border-border transition-colors group-hover:border-accent/10 leading-relaxed font-medium">
            <div className="p-2 bg-accent/10 rounded-lg shrink-0">
              <iconify-icon icon="solar:magic-stick-bold-duotone" width="20" height="20" className="text-accent" aria-hidden="true" />
            </div>
            <p className="line-clamp-3 italic">
              &ldquo;{rec.reason}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-3 justify-center md:border-l md:border-border md:pl-8 min-w-[200px]">
          <button
            onClick={onAccept}
            disabled={accepting || dismissing}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 active:scale-[0.98]"
          >
            {accepting ? (
              <>
                <iconify-icon icon="solar:refresh-bold-duotone" width="16" height="16" className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <iconify-icon icon="solar:cart-plus-bold-duotone" width="18" height="18" />
                Approve &amp; Add
              </>
            )}
          </button>
          <button
            onClick={onDismiss}
            disabled={accepting || dismissing}
            className="flex-1 md:flex-none inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted hover:text-danger hover:bg-danger-subtle/50 px-6 py-2.5 rounded-xl transition-all focus:outline-none"
          >
            {dismissing ? 'Dismissing…' : 'Dismiss Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}
