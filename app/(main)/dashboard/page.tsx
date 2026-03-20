'use client';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500">Welcome back. Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm flex items-center gap-2 transition-colors">
            <iconify-icon icon="solar:calendar-linear" width="18" height="18"></iconify-icon>
            Today
          </button>
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 shadow-sm flex items-center gap-2 transition-colors">
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18"></iconify-icon>
            Stock In
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Sales Today" value="฿12,450" change="+14%" positive icon="solar:wallet-money-linear" />
        <KpiCard title="Low Stock Items" value="8" change="3 urgent" negative icon="solar:danger-triangle-linear" />
        <KpiCard title="Forecasted Demand (7d)" value="142 kg" subtitle="Top: Coffee Beans" icon="solar:graph-up-linear" />
        <KpiCard title="Anomalies Detected" value="1" subtitle="Unusual butter usage" negative icon="solar:shield-warning-linear" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-neutral-900">Sales vs Forecast</h2>
            <select className="text-sm border-none bg-transparent text-neutral-500 focus:ring-0 cursor-pointer outline-none">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-64 w-full relative flex items-end gap-2">
            {/* Dummy Chart */}
            {[40, 55, 45, 70, 65, 85, 90].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                <div className="w-full bg-neutral-100 rounded-t-sm" style={{ height: `${val}%` }}>
                  <div className="w-full bg-neutral-900 rounded-t-sm transition-all" style={{ height: `${val * 0.8}%` }}></div>
                </div>
                <div className="text-xs text-center text-neutral-400 mt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Widget */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-neutral-900">Low Stock Alerts</h2>
            <a href="/alerts" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">View All</a>
          </div>
          <div className="flex-1 space-y-4">
            <LowStockItem name="Whole Milk" current="2 L" threshold="10 L" status="Critical" />
            <LowStockItem name="Croissant Dough" current="15 pcs" threshold="50 pcs" status="Warning" />
            <LowStockItem name="Paper Cups (8oz)" current="120 pcs" threshold="200 pcs" status="Warning" />
          </div>
          <button className="w-full mt-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
            Review Reorders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Recommendation Widget */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-neutral-900">AI Reorder Recommendations</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">AI Powered</span>
            </div>
          </div>
          <div className="space-y-3">
            <RecommendationItem 
              item="Whole Milk" 
              qty="20 L" 
              supplier="Dairy Co." 
              reason="Forecasted high demand this weekend. Lead time 1 day." 
            />
            <RecommendationItem 
              item="Espresso Beans" 
              qty="10 kg" 
              supplier="Roaster Inc." 
              reason="Current stock will deplete in 4 days based on trend." 
            />
          </div>
        </div>

        {/* Anomaly Widget */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-neutral-900">Anomalies Detected</h2>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex gap-3">
            <div className="mt-0.5">
              <iconify-icon icon="solar:danger-triangle-linear" width="20" height="20" className="text-red-500"></iconify-icon>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-900 mb-1">Unusual Butter Usage</h4>
              <p className="text-xs text-red-700 mb-2">Usage is 2.5x higher than average for a Tuesday. Check recipe compliance or wastage logs.</p>
              <button className="text-xs font-medium text-red-700 hover:text-red-800 underline">Investigate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, change, subtitle, positive, negative, icon }: any) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
        <div className="p-2 rounded-lg bg-neutral-50 text-neutral-600">
          <iconify-icon icon={icon} width="20" height="20"></iconify-icon>
        </div>
      </div>
      <div className="text-2xl font-medium tracking-tight text-neutral-900 mb-1">{value}</div>
      {change && (
        <div className={`text-xs font-medium ${positive ? 'text-emerald-600' : negative ? 'text-red-600' : 'text-neutral-500'}`}>
          {change} <span className="text-neutral-400 font-normal">vs last week</span>
        </div>
      )}
      {subtitle && (
        <div className="text-xs text-neutral-500">{subtitle}</div>
      )}
    </div>
  );
}

function LowStockItem({ name, current, threshold, status }: any) {
  const isCritical = status === 'Critical';
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0 last:pb-0">
      <div>
        <div className="text-sm font-medium text-neutral-900">{name}</div>
        <div className="text-xs text-neutral-500">Threshold: {threshold}</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{current}</div>
        <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded inline-block mt-1 ${isCritical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
          {status}
        </div>
      </div>
    </div>
  );
}

function RecommendationItem({ item, qty, supplier, reason }: any) {
  return (
    <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-medium text-neutral-900">{item}</div>
          <div className="text-xs text-neutral-500">from {supplier}</div>
        </div>
        <div className="text-sm font-medium text-neutral-900 bg-white px-2 py-1 rounded border border-neutral-200 shadow-sm">
          {qty}
        </div>
      </div>
      <div className="text-xs text-neutral-600 flex gap-1.5 items-start">
        <iconify-icon icon="solar:info-circle-linear" width="14" height="14" className="text-neutral-400 shrink-0 mt-0.5"></iconify-icon>
        {reason}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 bg-neutral-900 text-white text-xs font-medium py-1.5 rounded hover:bg-neutral-800 transition-colors">
          Accept & Draft PO
        </button>
        <button className="px-3 bg-white text-neutral-700 text-xs font-medium py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 transition-colors">
          Edit
        </button>
      </div>
    </div>
  );
}
