interface Report {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  lastGenerated: string;
  icon: string;
  iconColor: string;
}

export default function ReportsPage() {
  const reports: Report[] = [
    { id: 'REP-001', title: 'Monthly Sales Summary', description: 'Overview of sales performance, top products, and revenue for the month.', type: 'Sales', frequency: 'Monthly', lastGenerated: '2026-03-01', icon: 'solar:chart-square-linear', iconColor: 'text-blue-500' },
    { id: 'REP-002', title: 'Inventory Valuation', description: 'Current value of all stock on hand, categorized by product type.', type: 'Inventory', frequency: 'Weekly', lastGenerated: '2026-03-15', icon: 'solar:pie-chart-2-linear', iconColor: 'text-emerald-500' },
    { id: 'REP-003', title: 'Demand Forecast Accuracy', description: 'Comparison of forecasted demand vs actual sales over the past 30 days.', type: 'Forecasting', frequency: 'Monthly', lastGenerated: '2026-03-01', icon: 'solar:graph-up-linear', iconColor: 'text-indigo-500' },
    { id: 'REP-004', title: 'Supplier Performance', description: 'Analysis of supplier lead times, order fulfillment rates, and quality issues.', type: 'Suppliers', frequency: 'Quarterly', lastGenerated: '2026-01-01', icon: 'solar:document-text-linear', iconColor: 'text-amber-500' },
    { id: 'REP-005', title: 'Low Stock & Stockout History', description: 'Log of all low stock alerts and actual stockout events.', type: 'Inventory', frequency: 'Weekly', lastGenerated: '2026-03-15', icon: 'solar:document-linear', iconColor: 'text-red-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Reports & Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Generate, view, and schedule standard and custom reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18" aria-hidden="true"></iconify-icon>
            Create Custom Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center border border-neutral-100">
                <iconify-icon icon={report.icon} width="20" height="20" className={report.iconColor} aria-hidden="true"></iconify-icon>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80">
                {report.type}
              </span>
            </div>
            <h3 className="text-base font-medium text-neutral-900 mb-1">{report.title}</h3>
            <p className="text-sm text-neutral-500 mb-4 flex-1">{report.description}</p>
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <iconify-icon icon="solar:calendar-linear" width="14" height="14" aria-hidden="true"></iconify-icon>
                Last generated: {report.lastGenerated}
              </div>
              <button
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                aria-label={`Download ${report.title} as PDF`}
              >
                <iconify-icon icon="solar:download-linear" width="16" height="16" aria-hidden="true"></iconify-icon>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
