'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
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
    <div aria-hidden="true" className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-neutral-100 rounded w-1/3" />
          <div className="h-3 bg-neutral-100 rounded w-1/4" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-neutral-100 rounded w-2/3" />
            <div className="h-4 bg-neutral-100 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-neutral-100 rounded" />
    </div>
  );
}

export default function PurchasePlanningPage() {
  const workspaceId = useWorkspaceId();
  const recs = useQuery(
    api.purchasePlanning.recommendations,
    workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Purchase Planning</h1>
          <p className="text-sm text-neutral-500 mt-1">AI-driven reorder recommendations and draft orders.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
          <iconify-icon icon="solar:document-text-linear" width="18" height="18" aria-hidden="true" />
          View Draft Orders
        </button>
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-6 text-white shadow-xl flex items-start gap-4">
        <div className="p-3 bg-white/10 rounded-xl shrink-0">
          <iconify-icon icon="solar:stars-linear" width="24" height="24" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-medium mb-1">Smart Recommendations Active</h2>
          <p className="text-neutral-300 text-sm">
            Our AI has analyzed your sales history, current stock, and supplier lead times.
            Below are the recommended items to order today to prevent stockouts over the next 7 days.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-5 w-32 bg-neutral-100 rounded animate-pulse" />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (recs ?? []).length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-12 text-center">
          <iconify-icon icon="solar:cart-large-linear" width="40" height="40" className="text-neutral-300 mx-auto mb-4 block" aria-hidden="true" />
          <p className="text-base font-medium text-neutral-700 mb-1">No reorder recommendations</p>
          <p className="text-sm text-neutral-500">All stock levels are healthy — no urgent reorders needed.</p>
        </div>
      )}

      {/* High urgency */}
      {!isLoading && high.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-neutral-900">Urgent Reorders</h2>
          <div className="grid grid-cols-1 gap-4">
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
        <div className="space-y-4">
          <h2 className="text-base font-medium text-neutral-900 pt-2">Upcoming Needs</h2>
          <div className="grid grid-cols-1 gap-4">
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
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-medium text-neutral-900 truncate" title={itemName}>
                {itemName}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium shrink-0 ${
                isHigh
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
              }`}>
                {isHigh ? 'High' : 'Medium'} Urgency
              </span>
            </div>
            <div className="text-sm text-neutral-500 truncate">
              {itemSku} · Supplier: <span title={supplierName}>{supplierName}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-neutral-500 mb-1">Current Stock</div>
            <div className="text-sm font-medium text-neutral-900 tabular-nums">{currentStock}</div>
          </div>
          <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
            <div className="text-xs text-neutral-500 mb-1">Recommended</div>
            <div className="text-base font-medium text-neutral-900 tabular-nums">{recommendedQty}</div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-neutral-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <iconify-icon icon="solar:info-circle-linear" width="18" height="18" className="text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="line-clamp-3">{rec.reason}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 justify-center md:border-l md:border-neutral-100 md:pl-6 min-w-[160px]">
        <button
          onClick={onAccept}
          disabled={accepting || dismissing}
          className="w-full inline-flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {accepting ? 'Adding…' : 'Add to Draft Order'}
        </button>
        <button
          onClick={onDismiss}
          disabled={accepting || dismissing}
          className="w-full inline-flex items-center justify-center text-neutral-500 px-4 py-2 rounded-lg text-sm font-medium hover:text-neutral-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-50"
        >
          {dismissing ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
}
