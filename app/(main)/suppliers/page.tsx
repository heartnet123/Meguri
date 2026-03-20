import React from 'react';
import { Search, Plus, Filter, MoreVertical, Truck, Star, Phone, Mail } from 'lucide-react';

export default function SuppliersPage() {
  const suppliers = [
    { id: 'SUP-001', name: 'Global Coffee Beans Co.', category: 'Raw Materials', contact: 'David Smith', email: 'david@globalcoffee.com', phone: '+1 (555) 123-4567', rating: 4.8, status: 'Active', leadTime: '3-5 days' },
    { id: 'SUP-002', name: 'EcoPack Solutions', category: 'Packaging', contact: 'Sarah Jenkins', email: 'sarah@ecopack.com', phone: '+1 (555) 987-6543', rating: 4.5, status: 'Active', leadTime: '7-10 days' },
    { id: 'SUP-003', name: 'Dairy Fresh Farms', category: 'Perishables', contact: 'Mike Johnson', email: 'orders@dairyfresh.com', phone: '+1 (555) 456-7890', rating: 4.9, status: 'Active', leadTime: '1-2 days' },
    { id: 'SUP-004', name: 'Sweet Syrups Inc.', category: 'Ingredients', contact: 'Emily Chen', email: 'sales@sweetsyrups.com', phone: '+1 (555) 234-5678', rating: 4.2, status: 'Review', leadTime: '5-7 days' },
    { id: 'SUP-005', name: 'Premium Tea Importers', category: 'Raw Materials', contact: 'Robert Taylor', email: 'robert@premiumtea.com', phone: '+1 (555) 876-5432', rating: 4.7, status: 'Active', leadTime: '10-14 days' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Suppliers</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your vendors, track performance, and view contact details.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Export List
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Total Suppliers</h3>
          </div>
          <div className="text-2xl font-semibold text-neutral-900">24</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Star className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Average Rating</h3>
          </div>
          <div className="text-2xl font-semibold text-neutral-900">4.6<span className="text-base text-neutral-500 font-normal">/5.0</span></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <iconify-icon icon="solar:clock-circle-linear" width="16" height="16"></iconify-icon>
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Pending Orders</h3>
          </div>
          <div className="text-2xl font-semibold text-neutral-900">8</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search suppliers, contacts..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Filter className="w-4 h-4" />
              Category
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
                <th className="px-6 py-3 font-medium">Supplier Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Contact Info</th>
                <th className="px-6 py-3 font-medium text-center">Lead Time</th>
                <th className="px-6 py-3 font-medium text-center">Rating</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{supplier.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{supplier.id}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{supplier.category}</td>
                  <td className="px-6 py-4">
                    <div className="text-neutral-900 font-medium">{supplier.contact}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <a href={`mailto:${supplier.email}`} className="text-xs text-neutral-500 hover:text-blue-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {supplier.email}
                      </a>
                      <a href={`tel:${supplier.phone}`} className="text-xs text-neutral-500 hover:text-blue-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {supplier.phone}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-neutral-600">{supplier.leadTime}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium text-neutral-900">{supplier.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      supplier.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                    }`}>
                      {supplier.status}
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
          <div>Showing 1 to 5 of 24 suppliers</div>
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
