'use client';

import { Fragment, useState } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWorkspaceId } from '@/app/providers/WorkspaceProvider';

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
  return <div className="h-7 w-20 rounded bg-surface-raised motion-safe:animate-pulse" />;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} aria-hidden="true" className="motion-safe:animate-pulse">
          {['w-2/3', 'w-1/3', 'w-1/4', 'w-1/5', 'w-1/4', 'w-1/5'].map((w, j) => (
            <td key={j} className="px-6 py-4">
              <div className={`h-4 bg-surface-raised rounded ${w}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function trendDisplay(trendPct?: number) {
  if (trendPct === undefined) return { label: 'ไม่มีข้อมูล', cls: 'text-muted' };
  const label = trendPct >= 0 ? `+${trendPct}%` : `${trendPct}%`;
  const cls = trendPct > 0 ? 'text-success' : trendPct < 0 ? 'text-danger' : 'text-muted';
  return { label, cls };
}

function confidenceDisplay(confidence: ForecastRow['confidence']) {
  switch (confidence) {
    case 'high':
      return {
        label: 'สูง',
        cls: 'bg-success-subtle/50 text-success border-success/20',
      };
    case 'low':
      return {
        label: 'ต่ำ',
        cls: 'bg-danger-subtle/50 text-danger border-danger/20',
      };
    default:
      return {
        label: 'ปานกลาง',
        cls: 'bg-warning-subtle/50 text-warning border-warning/20',
      };
  }
}

export default function ForecastingPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const [periodDays, setPeriodDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const generateForecasts = useMutation(api.forecasting.generate);
  const numberFormatter = new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 1,
  });

  const handleRefresh = async () => {
    if (!workspaceId) return;
    setRefreshError(null);
    setIsGenerating(true);
    try {
      await generateForecasts({ workspaceId });
    } catch {
      setRefreshError('ไม่สามารถรีเฟรชการคาดการณ์ได้ในขณะนี้ ลองอีกครั้งในอีกสักครู่');
    } finally {
      setIsGenerating(false);
    }
  };

  const statsArgs = workspaceId && isAuthenticated ? { workspaceId } : 'skip';
  const forecastArgs = workspaceId && isAuthenticated ? { workspaceId, periodDays } : 'skip';

  const forecasts = useQuery(
    api.forecasting.latestByItem,
    forecastArgs
  ) as ForecastRow[] | undefined;

  const stats = useQuery(
    api.forecasting.stats,
    statsArgs
  ) as ForecastStats | undefined;

  const isLoading = workspaceId !== undefined && forecasts === undefined;
  const isEmpty = !isLoading && (forecasts ?? []).length === 0;

  const accuracyPct = stats && stats.itemsWithForecasts > 0
    ? Math.round((stats.itemsHighConfidence / stats.itemsWithForecasts) * 100)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">การคาดการณ์ความต้องการ</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            ใช้ยอดขายย้อนหลังเพื่อประเมินความต้องการในช่วงเวลาถัดไป พร้อมสรุประดับความมั่นใจและความเสี่ยงด้านข้อมูล
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <select
            aria-label="เลือกระยะเวลาคาดการณ์"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/10"
          >
            <option value={7}>7 วันถัดไป</option>
            <option value={14}>14 วันถัดไป</option>
            <option value={30}>30 วันถัดไป</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isGenerating || !workspaceId || !isAuthenticated}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-accent-fg transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <iconify-icon
              icon="solar:refresh-bold-duotone"
              width="18"
              height="18"
              aria-hidden="true"
              className={isGenerating ? 'motion-safe:animate-spin' : ''}
            />
            {isGenerating ? 'กำลังรีเฟรช...' : 'รีเฟรชการคาดการณ์'}
          </button>
        </div>
      </div>

      {refreshError && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/20 bg-danger-subtle px-4 py-3 text-sm text-danger"
        >
          {refreshError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-2">อัตราความมั่นใจสูง</div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats === undefined ? <StatSkeleton /> : accuracyPct !== null ? `${accuracyPct}%` : '—'}
          </div>
          {stats && accuracyPct !== null && (
            <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-success">
              วิเคราะห์แล้ว {stats.itemsWithForecasts.toLocaleString('th-TH')} รายการ
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-2">รายการที่มีการคาดการณ์</div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats === undefined
              ? <StatSkeleton />
              : <>{stats.itemsWithForecasts.toLocaleString('th-TH')} <span className="text-lg font-medium text-muted/40">/ {stats.totalItems.toLocaleString('th-TH')}</span></>
            }
          </div>
          <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted">มีประวัติยอดขายเพียงพอสำหรับช่วงเวลานี้</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-2">ปัญหาคุณภาพข้อมูล</div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats === undefined ? <StatSkeleton /> : stats.dataQualityIssues.toLocaleString('th-TH')}
          </div>
          {stats && stats.dataQualityIssues > 0 && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-warning mt-3 flex items-center gap-2">
              <iconify-icon icon="solar:danger-triangle-bold-duotone" width="14" height="14" aria-hidden="true" />
              ต้องตรวจสอบก่อนใช้ตัดสินใจเชิงสั่งซื้อ
            </div>
          )}
        </div>
      </div>

      {/* Item-level Forecasts */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
        <div className="border-b border-border bg-surface-raised/30 p-5">
          <h2 className="text-base font-bold text-foreground">ข้อมูลเชิงลึกการคาดการณ์</h2>
          <div className="mt-1 text-sm text-muted">
            ดูปริมาณที่คาดการณ์ แนวโน้ม และข้อควรระวังของแต่ละสินค้าในช่วง {periodDays} วันถัดไป
          </div>
        </div>
        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">ตารางคาดการณ์ความต้องการรายสินค้า พร้อมระดับความมั่นใจและแนวโน้ม</caption>
            <thead className="text-[10px] text-muted font-bold uppercase tracking-widest bg-surface-raised/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4">รายการ</th>
                <th scope="col" className="px-6 py-4">โมเดลคาดการณ์</th>
                <th scope="col" className="px-6 py-4 text-right">คาดการณ์ {periodDays} วันถัดไป</th>
                <th scope="col" className="px-6 py-4 text-right">แนวโน้ม</th>
                <th scope="col" className="px-6 py-4">ความมั่นใจ</th>
                <th scope="col" className="px-6 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <TableSkeleton />
              ) : isEmpty ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                      <iconify-icon icon="solar:graph-up-bold-duotone" width="32" height="32" className="text-muted/40 mx-auto" aria-hidden="true" />
                    </div>
                    <p className="text-base font-bold text-foreground">ยังไม่มีข้อมูลการคาดการณ์</p>
                    <p className="text-sm text-muted mt-1 leading-relaxed">เพิ่มสินค้าคงคลังและประวัติยอดขายเพื่อเปิดใช้งานการคาดการณ์ด้วย AI</p>
                  </td>
                </tr>
              ) : (
                forecasts!.map((row) => {
                  const { label: trendLabel, cls: trendCls } = trendDisplay(row.trendPct);
                  const confidenceMeta = confidenceDisplay(row.confidence);
                  const detailsId = `forecast-detail-${row._id}`;
                  const isExpanded = expandedRowId === row._id;
                  return (
                    <Fragment key={row._id}>
                      <tr key={row._id} className="transition-colors hover:bg-surface-raised/40">
                        <td className="max-w-[240px] px-6 py-5">
                          <div className="whitespace-normal break-words font-semibold leading-5 text-foreground">
                            {row.itemName}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex max-w-[15rem] whitespace-normal break-words rounded bg-surface-raised px-2 py-1 text-left text-[10px] font-bold uppercase tracking-widest text-muted border border-border">
                            {row.model}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-foreground tabular-nums whitespace-nowrap tracking-tight">
                          {numberFormatter.format(row.predictedQty)}{' '}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">{row.itemUnit}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-widest tabular-nums ${trendCls}`}>{trendLabel}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${confidenceMeta.cls}`}>
                            {confidenceMeta.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={detailsId}
                            onClick={() => setExpandedRowId(isExpanded ? null : row._id)}
                            className="inline-flex items-center justify-end gap-2 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                          >
                            {row.warning ? 'ดูคำเตือน' : 'ดูรายละเอียด'}
                            <iconify-icon
                              icon={isExpanded ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
                              width="14"
                              height="14"
                              aria-hidden="true"
                            />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr id={detailsId} className="bg-surface-raised/25">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60">โมเดล</div>
                                <div className="mt-1 whitespace-normal break-words text-sm text-foreground">{row.model}</div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60">ช่วงเวลาที่ใช้ประเมิน</div>
                                <div className="mt-1 text-sm text-foreground">{row.periodDays.toLocaleString('th-TH')} วัน</div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60">สถานะข้อมูล</div>
                                <div className={`mt-1 text-sm ${row.warning ? 'text-warning' : 'text-muted'}`}>
                                  {row.warning ?? 'ไม่พบคำเตือนด้านข้อมูล'}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
