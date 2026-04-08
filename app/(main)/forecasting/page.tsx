'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

type ForecastRow = {
  _id: string;
  itemName: string;
  itemUnit: string;
  model: string;
  predictedQty: number;
  trendPct?: number;
  confidence: 'high' | 'medium' | 'low';
  warning?: string;
  periodDays: number;
};

type ForecastStats = {
  totalItems: number;
  itemsWithForecasts: number;
  itemsHighConfidence: number;
  dataQualityIssues: number;
};

function StatSkeleton() {
  return <div className="h-7 w-20 bg-neutral-100 rounded animate-pulse" />;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} aria-hidden="true" className="animate-pulse">
          {['w-2/3', 'w-1/3', 'w-1/4', 'w-1/5', 'w-1/4', 'w-1/5'].map((w, j) => (
            <td key={j} className="px-6 py-4">
              <div className={`h-4 bg-neutral-100 rounded ${w}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function trendDisplay(trendPct?: number) {
  if (trendPct === undefined) return { label: 'N/A', cls: 'text-neutral-500' };
  const label = trendPct >= 0 ? `+${trendPct}%` : `${trendPct}%`;
  const cls = trendPct > 0 ? 'text-emerald-600' : trendPct < 0 ? 'text-red-600' : 'text-neutral-500';
  return { label, cls };
}

export default function ForecastingPage() {
  const { workspaceId, workspaceValidated } = useWorkspace();
  const [periodDays, setPeriodDays] = useState(7);

  const forecasts = useQuery(
    api.forecasting.latestByItem,
    workspaceId ? { workspaceId, periodDays } : 'skip'
  ) as ForecastRow[] | undefined;

  const stats = useQuery(
    api.forecasting.stats,
    workspaceId && workspaceValidated ? { workspaceId } : 'skip'
  ) as ForecastStats | undefined;

  const isLoading = workspaceId !== undefined && forecasts === undefined;
  const isEmpty = !isLoading && (forecasts ?? []).length === 0;

  const accuracyPct = stats && stats.itemsWithForecasts > 0
    ? Math.round((stats.itemsHighConfidence / stats.itemsWithForecasts) * 100)
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Demand Forecasting</h1>
          <p className="text-sm text-neutral-500 mt-1">AI-powered predictions based on historical sales and seasonality.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Select forecast period"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 shadow-sm transition-shadow"
          >
            <option value={7}>Next 7 Days</option>
            <option value={14}>Next 14 Days</option>
            <option value={30}>Next 30 Days</option>
          </select>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            <iconify-icon icon="solar:refresh-linear" width="18" height="18" aria-hidden="true" />
            Refresh Forecast
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="text-sm font-medium text-neutral-500 mb-1">High Confidence Rate</div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined ? <StatSkeleton /> : accuracyPct !== null ? `${accuracyPct}%` : '—'}
          </div>
          {stats && accuracyPct !== null && (
            <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <iconify-icon icon="solar:graph-up-linear" width="14" height="14" aria-hidden="true" />
              Based on {stats.itemsWithForecasts} items
            </div>
          )}
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="text-sm font-medium text-neutral-500 mb-1">Items with Forecasts</div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined
              ? <StatSkeleton />
              : <>{stats.itemsHighConfidence.toLocaleString()} / {stats.totalItems.toLocaleString()}</>
            }
          </div>
          <div className="text-xs text-neutral-500 mt-1">Sufficient sales history</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="text-sm font-medium text-neutral-500 mb-1">Data Quality Issues</div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">
            {stats === undefined ? <StatSkeleton /> : stats.dataQualityIssues.toLocaleString()}
          </div>
          {stats && stats.dataQualityIssues > 0 && (
            <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <iconify-icon icon="solar:danger-triangle-linear" width="14" height="14" aria-hidden="true" />
              Some items lack sufficient history
            </div>
          )}
        </div>
      </div>

      {/* Main Chart placeholder */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-base font-medium text-neutral-900">Aggregate Demand Forecast</h2>
            <p className="text-xs text-neutral-500">Actual sales vs. forecast across all items</p>
          </div>
          <div className="flex items-center gap-4 text-sm" role="list" aria-label="Chart legend">
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-3 h-3 rounded-full bg-neutral-400" aria-hidden="true" />
              <span className="text-neutral-600">Historical</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-3 h-3 rounded-full bg-teal-600" aria-hidden="true" />
              <span className="text-neutral-600">Forecast</span>
            </div>
          </div>
        </div>
        <div
          className="h-80 w-full relative border-b border-l border-neutral-200 ml-10 mb-8"
          role="img"
          aria-label="Demand forecast chart. Connect real data to populate."
        >
          <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-xs text-neutral-400 py-2" aria-hidden="true">
            <span>1000</span><span>750</span><span>500</span><span>250</span><span>0</span>
          </div>
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
            {[25, 50, 75].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e5e5" strokeWidth="0.5" />
            ))}
            <path d="M60,45 L70,35 L80,40 L90,25 L100,30 L100,60 L90,55 L80,70 L70,65 L60,75 Z" fill="#99f6e4" opacity="0.4" />
            <path d="M0,60 L10,55 L20,70 L30,40 L40,50 L50,30 L60,60" fill="none" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M60,60 L70,50 L80,55 L90,40 L100,45" fill="none" stroke="#0d9488" strokeWidth="2" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="60" y1="0" x2="60" y2="100" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-neutral-400" aria-hidden="true">
            <span>–30d</span><span>–21d</span><span>–14d</span><span className="text-red-500 font-medium">Today</span><span>+7d</span><span>+14d</span>
          </div>
        </div>
      </div>

      {/* Item-level Forecasts */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50">
          <h2 className="text-base font-medium text-neutral-900">Forecast by Item</h2>
        </div>
        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Item-level demand forecasts with confidence ratings</caption>
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Item</th>
                <th scope="col" className="px-6 py-3 font-medium">Forecast Method</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Next {periodDays} Days</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Trend</th>
                <th scope="col" className="px-6 py-3 font-medium">Confidence</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <TableSkeleton />
              ) : isEmpty ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <iconify-icon icon="solar:graph-up-linear" width="32" height="32" className="text-neutral-300 mx-auto mb-3 block" aria-hidden="true" />
                    <p className="text-sm font-medium text-neutral-700">No forecasts available</p>
                    <p className="text-xs text-neutral-500 mt-1">Add inventory items and sales data to generate forecasts.</p>
                  </td>
                </tr>
              ) : (
                forecasts!.map((row) => {
                  const { label: trendLabel, cls: trendCls } = trendDisplay(row.trendPct);
                  const isHigh = row.confidence === 'high';
                  const isLow = row.confidence === 'low';
                  return (
                    <tr key={row._id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900 max-w-[200px]">
                        <span className="block truncate" title={row.itemName}>{row.itemName}</span>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 text-xs max-w-[160px]">
                        <span className="block truncate" title={row.model}>{row.model}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-neutral-900 tabular-nums whitespace-nowrap">
                        {row.predictedQty.toLocaleString()} {row.itemUnit}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-medium tabular-nums ${trendCls}`}>{trendLabel}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                            isHigh ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                            isLow ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                            'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                          }`}>
                            {row.confidence.charAt(0).toUpperCase() + row.confidence.slice(1)}
                          </span>
                          {row.warning && (
                            <span title={row.warning} aria-label={row.warning} className="cursor-help shrink-0">
                              <iconify-icon icon="solar:danger-circle-linear" width="16" height="16" className="text-amber-500" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 rounded">
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
