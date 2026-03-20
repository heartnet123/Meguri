import React from 'react';
import { Search, Filter, MoreVertical, AlertTriangle, Bell, Info, CheckCircle2 } from 'lucide-react';

export default function AlertsPage() {
  const alerts = [
    { id: 'ALT-1042', type: 'Anomaly', severity: 'High', title: 'Unusual Demand Spike', description: 'Matcha Latte Kit demand is 300% higher than forecasted for this week.', date: '2 hours ago', status: 'Unresolved' },
    { id: 'ALT-1041', type: 'Stock', severity: 'Critical', title: 'Stockout Risk', description: 'Cold Brew Concentrate will run out in 2 days based on current sales velocity.', date: '5 hours ago', status: 'Unresolved' },
    { id: 'ALT-1040', type: 'System', severity: 'Low', title: 'Data Sync Completed', description: 'Daily POS data synchronization completed successfully.', date: '12 hours ago', status: 'Resolved' },
    { id: 'ALT-1039', type: 'Supplier', severity: 'Medium', title: 'Delivery Delay', description: 'EcoPack Solutions order #PO-2094 is delayed by 2 days.', date: '1 day ago', status: 'Unresolved' },
    { id: 'ALT-1038', type: 'Anomaly', severity: 'Medium', title: 'Price Variance', description: 'Cost of Oat Milk Carton (1L) increased by 15% from previous order.', date: '2 days ago', status: 'Resolved' },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'High': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'Medium': return <Bell className="w-5 h-5 text-amber-500" />;
      case 'Low': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
      case 'High': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20';
      case 'Medium': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
      case 'Low': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
      default: return 'bg-neutral-50 text-neutral-700 ring-1 ring-neutral-600/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Alerts & Anomalies</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitor system alerts, stock warnings, and AI-detected anomalies.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm font-medium text-neutral-600 mb-1">Total Unresolved</div>
          <div className="text-2xl font-semibold text-neutral-900">12</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm font-medium text-neutral-600 mb-1">Critical Alerts</div>
          <div className="text-2xl font-semibold text-red-600">3</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm font-medium text-neutral-600 mb-1">AI Anomalies</div>
          <div className="text-2xl font-semibold text-indigo-600">5</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm font-medium text-neutral-600 mb-1">Stock Warnings</div>
          <div className="text-2xl font-semibold text-amber-600">4</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Filter className="w-4 h-4" />
              Severity
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Filter className="w-4 h-4" />
              Type
            </button>
          </div>
        </div>

        <div className="divide-y divide-neutral-200">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 hover:bg-neutral-50/50 transition-colors flex gap-4 ${alert.status === 'Resolved' ? 'opacity-60' : ''}`}>
              <div className="flex-shrink-0 mt-1">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-neutral-900">{alert.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${getSeverityClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200">
                      {alert.type}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 whitespace-nowrap">{alert.date}</span>
                </div>
                <p className="text-sm text-neutral-600 line-clamp-2">{alert.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  {alert.status === 'Unresolved' ? (
                    <>
                      <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View Details</button>
                      <button className="text-xs font-medium text-neutral-500 hover:text-neutral-700">Mark as Resolved</button>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <button className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-neutral-200 flex items-center justify-center text-sm text-neutral-500 bg-neutral-50/50">
          <button className="text-neutral-900 font-medium hover:underline">View All Alerts</button>
        </div>
      </div>
    </div>
  );
}
