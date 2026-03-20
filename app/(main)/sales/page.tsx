import React from 'react';
import { Search, Plus, Filter, MoreVertical, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';

export default function SalesPage() {
  const transactions = [
    { id: 'TRX-8921', date: '2026-03-20 14:32', customer: 'Walk-in Customer', items: 3, total: '$42.50', status: 'Completed', payment: 'Credit Card' },
    { id: 'TRX-8920', date: '2026-03-20 14:15', customer: 'Sarah Jenkins', items: 1, total: '$18.00', status: 'Completed', payment: 'Cash' },
    { id: 'TRX-8919', date: '2026-03-20 13:45', customer: 'B2B Wholesale - Cafe 101', items: 24, total: '$450.00', status: 'Pending', payment: 'Invoice' },
    { id: 'TRX-8918', date: '2026-03-20 13:10', customer: 'Walk-in Customer', items: 2, total: '$12.00', status: 'Completed', payment: 'Mobile Pay' },
    { id: 'TRX-8917', date: '2026-03-20 12:55', customer: 'Michael Chang', items: 5, total: '$65.00', status: 'Completed', payment: 'Credit Card' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Sales & Transactions</h1>
          <p className="text-sm text-neutral-500 mt-1">Track your daily sales, orders, and revenue performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Export Report
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Today&apos;s Revenue</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-neutral-900">$1,248.50</div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">+12.5%</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Orders Today</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-neutral-900">84</div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">+5.2%</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Average Order Value</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-neutral-900">$14.86</div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">+2.1%</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search transactions, customers..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Filter className="w-4 h-4" />
              Date Range
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Filter className="w-4 h-4" />
              Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 font-medium">Transaction ID</th>
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium text-right">Items</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium text-center">Payment</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-neutral-900 font-medium">{trx.id}</td>
                  <td className="px-6 py-4 text-neutral-600">{trx.date}</td>
                  <td className="px-6 py-4 text-neutral-900 font-medium">{trx.customer}</td>
                  <td className="px-6 py-4 text-right text-neutral-600">{trx.items}</td>
                  <td className="px-6 py-4 text-right font-medium text-neutral-900">{trx.total}</td>
                  <td className="px-6 py-4 text-center text-neutral-600">{trx.payment}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      trx.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      trx.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                      'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-600/20'
                    }`}>
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-sm text-neutral-500 bg-neutral-50/50">
          <div>Showing 1 to 5 of 84 transactions today</div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors bg-white font-medium text-neutral-900">1</button>
            <button className="px-3 py-1 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors">2</button>
            <button className="px-3 py-1 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors">3</button>
            <span className="px-2">...</span>
            <button className="px-3 py-1 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
