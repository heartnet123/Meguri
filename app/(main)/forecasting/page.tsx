'use client';

export default function ForecastingPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Demand Forecasting</h1>
          <p className="text-sm text-neutral-500">AI-powered predictions based on historical sales and seasonality.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 shadow-sm outline-none transition-shadow">
            <option>Next 7 Days</option>
            <option>Next 14 Days</option>
            <option>Next 30 Days</option>
          </select>
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 shadow-sm flex items-center gap-2 transition-colors">
            <iconify-icon icon="solar:refresh-linear" width="18" height="18"></iconify-icon>
            Retrain Models
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="text-sm font-medium text-neutral-500 mb-1">Overall Forecast Accuracy (MAPE)</div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">92.4%</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <iconify-icon icon="solar:graph-up-linear" width="14" height="14"></iconify-icon>
            +1.2% vs last month
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="text-sm font-medium text-neutral-500 mb-1">Items with High Confidence</div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">145 / 160</div>
          <div className="text-xs text-neutral-500 mt-1">Sufficient historical data</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="text-sm font-medium text-neutral-500 mb-1">Data Quality Issues</div>
          <div className="text-2xl font-medium tracking-tight text-neutral-900">2</div>
          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <iconify-icon icon="solar:danger-triangle-linear" width="14" height="14"></iconify-icon>
            Missing data detected
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-medium text-neutral-900">Aggregate Demand Forecast</h2>
            <p className="text-xs text-neutral-500">Historical vs Predicted Volume across all categories</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
              <span className="text-neutral-600">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-900"></div>
              <span className="text-neutral-600">Forecast</span>
            </div>
          </div>
        </div>
        
        <div className="h-80 w-full relative border-b border-l border-neutral-200">
          {/* Y-axis labels */}
          <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between text-[10px] text-neutral-400 py-2">
            <span>1000</span>
            <span>750</span>
            <span>500</span>
            <span>250</span>
            <span>0</span>
          </div>
          
          {/* Chart area */}
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Grid lines */}
            {[25, 50, 75].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e5e5" strokeWidth="0.5" />
            ))}
            
            {/* Confidence Band */}
            <path d="M60,45 L70,35 L80,40 L90,25 L100,30 L100,60 L90,55 L80,70 L70,65 L60,75 Z" fill="#f3f4f6" opacity="0.5" />
            
            {/* Historical Line */}
            <path d="M0,60 L10,55 L20,70 L30,40 L40,50 L50,30 L60,60" fill="none" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Forecast Line */}
            <path d="M60,60 L70,50 L80,55 L90,40 L100,45" fill="none" stroke="#171717" strokeWidth="2" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Divider */}
            <line x1="60" y1="0" x2="60" y2="100" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-neutral-400">
            <span>Mar 1</span>
            <span>Mar 8</span>
            <span>Mar 15</span>
            <span className="text-red-500 font-medium">Today</span>
            <span>Mar 29</span>
            <span>Apr 5</span>
          </div>
        </div>
      </div>

      {/* Item Level Forecasts */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-base font-medium text-neutral-900">Forecast by Item</h2>
          <div className="relative">
            <iconify-icon icon="solar:magnifer-linear" width="16" height="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"></iconify-icon>
            <input type="text" placeholder="Search items..." className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none w-48 transition-shadow" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
              <tr>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Model Used</th>
                <th className="px-6 py-3 text-right">Predicted (7d)</th>
                <th className="px-6 py-3 text-right">Trend</th>
                <th className="px-6 py-3">Confidence</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <ForecastRow item="Croissant Dough" model="SARIMA (Seasonality)" predicted="120 pcs" trend="+15%" confidence="High" />
              <ForecastRow item="Whole Milk" model="XGBoost" predicted="25 L" trend="+5%" confidence="High" />
              <ForecastRow item="Almond Milk" model="Moving Average" predicted="8 L" trend="-2%" confidence="Medium" />
              <ForecastRow item="Seasonal Syrup" model="Baseline" predicted="3 btl" trend="N/A" confidence="Low" warning="Insufficient data" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ForecastRow({ item, model, predicted, trend, confidence, warning }: any) {
  const isHigh = confidence === 'High';
  const isLow = confidence === 'Low';
  
  return (
    <tr className="hover:bg-neutral-50 transition-colors group">
      <td className="px-6 py-4 font-medium text-neutral-900">{item}</td>
      <td className="px-6 py-4 text-neutral-500 text-xs">{model}</td>
      <td className="px-6 py-4 text-right font-medium text-neutral-900">{predicted}</td>
      <td className="px-6 py-4 text-right">
        <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-emerald-600' : trend.startsWith('-') ? 'text-red-600' : 'text-neutral-500'}`}>
          {trend}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isHigh ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
            isLow ? 'bg-red-50 text-red-700 border border-red-100' : 
            'bg-amber-50 text-amber-700 border border-amber-100'
          }`}>
            {confidence}
          </span>
          {warning && (
            <div className="group/tooltip relative cursor-help">
              <iconify-icon icon="solar:danger-circle-linear" width="16" height="16" className="text-amber-500"></iconify-icon>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
                {warning}
              </div>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline transition-colors">View Details</button>
      </td>
    </tr>
  );
}
