'use client';

import { useState } from 'react';
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
  return <div className="h-7 w-20 bg-surface-raised rounded animate-pulse" />;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} aria-hidden="true" className="animate-pulse">
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
  if (trendPct === undefined) return { label: 'N/A', cls: 'text-muted' };
  const label = trendPct >= 0 ? `+${trendPct}%` : `${trendPct}%`;
  const cls = trendPct > 0 ? 'text-success' : trendPct < 0 ? 'text-danger' : 'text-muted';
  return { label, cls };
}

export default function ForecastingPage() {
  const { isAuthenticated } = useConvexAuth();
  const workspaceId = useWorkspaceId();
  const [periodDays, setPeriodDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateForecasts = useMutation(api.forecasting.generate);

  const handleRefresh = async () => {
    if (!workspaceId) return;
    setIsGenerating(true);
    try {
      await generateForecasts({ workspaceId });
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">การคาดการณ์ความต้องการ</h1>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">ใช้ AI ทำนายจากยอดขายย้อนหลังและฤดูกาล</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select
            aria-label="เลือกระยะเวลาคาดการณ์"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all hover:bg-surface-raised"
          >
            <option value={7}>7 วันถัดไป</option>
            <option value={14}>14 วันถัดไป</option>
            <option value={30}>30 วันถัดไป</option>
          </select>
          <button 
            onClick={handleRefresh}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 active:scale-[0.98]"
          >
            <iconify-icon icon="solar:refresh-bold-duotone" width="18" height="18" aria-hidden="true" className={isGenerating ? "animate-spin" : ""} />
            {isGenerating ? 'กำลังรีเฟรช...' : 'รีเฟรชการคาดการณ์'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 group transition-all hover:border-accent/20">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-2">อัตราความมั่นใจสูง</div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats === undefined ? <StatSkeleton /> : accuracyPct !== null ? `${accuracyPct}%` : '—'}
          </div>
          {stats && accuracyPct !== null && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-success mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
วิเคราะห์แล้ว {stats.itemsWithForecasts} รายการ
            </div>
          )}
        </div>
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 group transition-all hover:border-accent/20">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-2">รายการที่มีการคาดการณ์</div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats === undefined
              ? <StatSkeleton />
              : <>{stats.itemsHighConfidence.toLocaleString()} <span className="text-muted/40 font-medium text-lg">/ {stats.totalItems.toLocaleString()}</span></>
            }
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted mt-3">มีประวัติยอดขายเพียงพอ</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 group transition-all hover:border-accent/20">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-2">ปัญหาคุณภาพข้อมูล</div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats === undefined ? <StatSkeleton /> : stats.dataQualityIssues.toLocaleString()}
          </div>
          {stats && stats.dataQualityIssues > 0 && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-warning mt-3 flex items-center gap-2">
              <iconify-icon icon="solar:danger-triangle-bold-duotone" width="14" height="14" aria-hidden="true" />
ต้องดำเนินการเพื่อความแม่นยำ
            </div>
          )}
        </div>
      </div>

      {/* Main Chart placeholder */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground">ภาพรวมการคาดการณ์ความต้องการ</h2>
            <p className="text-xs text-muted mt-0.5 font-medium">ยอดขายจริงเทียบกับการคาดการณ์ในทุกสินค้าคงคลัง</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest" role="list" aria-label="Chart legend">
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-2.5 h-2.5 rounded-full bg-muted/40 shadow-sm" aria-hidden="true" />
              <span className="text-muted">ยอดขายย้อนหลัง</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-md shadow-accent/20" aria-hidden="true" />
              <span className="text-muted">การคาดการณ์อัจฉริยะ</span>
            </div>
          </div>
        </div>
        <div
          className="h-80 w-full relative border-b border-l border-border ml-10 mb-8"
          role="img"
          aria-label="กราฟการคาดการณ์ความต้องการแสดงแนวโน้มย้อนหลังและแนวโน้มที่คาดการณ์"
        >
          {/* Y-Axis Labels */}
          <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold uppercase tracking-widest text-muted/30 py-2 pointer-events-none" aria-hidden="true">
            <span>2k</span><span>1.5k</span><span>1k</span><span>500</span><span>0</span>
          </div>
          
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
            {/* Grid lines */}
            {[25, 50, 75].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-border" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            
            {/* Confidence Area */}
            <path d="M60,45 L70,35 L80,40 L90,25 L100,30 L100,60 L90,55 L80,70 L70,65 L60,75 Z" fill="currentColor" className="text-accent/10" />
            
            {/* Historical Line */}
            <path d="M0,60 L10,55 L20,70 L30,40 L40,50 L50,30 L60,60" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Forecast Line */}
            <path d="M60,60 L70,50 L80,55 L90,40 L100,45" fill="none" stroke="currentColor" className="text-accent" strokeWidth="2.5" strokeDasharray="3 2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Today Indicator */}
            <line x1="60" y1="0" x2="60" y2="100" stroke="currentColor" className="text-danger" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>

          {/* X-Axis Labels */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted/40" aria-hidden="true">
            <span>เดือนก่อน</span><span>–21 วัน</span><span>–14 วัน</span><span className="text-danger font-bold bg-danger-subtle/50 px-2 py-0.5 rounded-full">วันนี้</span><span>+7 วัน</span><span>สัปดาห์หน้า</span>
          </div>
        </div>
      </div>

      {/* Item-level Forecasts */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
        <div className="p-5 border-b border-border bg-surface-raised/30 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">ข้อมูลเชิงลึกการคาดการณ์</h2>
          <div className="px-3 py-1 bg-surface-raised border border-border rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">วิเคราะห์แบบเรียลไทม์</span>
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
                  const isHigh = row.confidence === 'high';
                  const isLow = row.confidence === 'low';
                  return (
                    <tr key={row._id} className="hover:bg-accent-subtle/5 transition-colors group">
                      <td className="px-6 py-5 font-bold text-foreground max-w-[200px]">
                        <span className="block truncate group-hover:text-accent transition-colors" title={row.itemName}>{row.itemName}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-raised text-[10px] font-bold uppercase tracking-widest text-muted border border-border" title={row.model}>{row.model}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-foreground tabular-nums whitespace-nowrap tracking-tight">
                        {row.predictedQty.toLocaleString()} <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">{row.itemUnit}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-[10px] font-bold uppercase tracking-widest tabular-nums ${trendCls}`}>{trendLabel}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border shadow-sm ${
                            isHigh ? 'bg-success-subtle/50 text-success border-success/20' :
                            isLow ? 'bg-danger-subtle/50 text-danger border-danger/20' :
                            'bg-warning-subtle/50 text-warning border-warning/20'
                          }`}>
                            {row.confidence}
                          </span>
                          {row.warning && (
                            <span title={row.warning} aria-label={row.warning} className="cursor-help shrink-0 hover:scale-110 transition-transform">
                              <iconify-icon icon="solar:danger-circle-bold-duotone" width="18" height="18" className="text-warning" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-accent transition-colors focus:outline-none">
รายละเอียด
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
