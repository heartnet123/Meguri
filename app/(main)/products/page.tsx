import React from 'react';
import { Search, Plus, Filter, MoreVertical, Package, Layers } from 'lucide-react';

export default function ProductsPage() {
  const products = [
    { id: 'PRD-001', name: 'Signature Espresso Blend', category: 'Finished Goods', sku: 'ESP-250G', price: '$18.00', cost: '$6.50', margin: '64%', stock: 120, status: 'In Stock' },
    { id: 'PRD-002', name: 'Cold Brew Concentrate', category: 'Finished Goods', sku: 'CB-1L', price: '$24.00', cost: '$8.20', margin: '66%', stock: 45, status: 'Low Stock' },
    { id: 'PRD-003', name: 'Matcha Latte Kit', category: 'Bundles', sku: 'MAT-KIT', price: '$35.00', cost: '$15.00', margin: '57%', stock: 12, status: 'Critical' },
    { id: 'PRD-004', name: 'Oat Milk Carton (1L)', category: 'Raw Materials', sku: 'OAT-1L', price: '$4.50', cost: '$2.10', margin: '53%', stock: 300, status: 'In Stock' },
    { id: 'PRD-005', name: 'Vanilla Syrup (750ml)', category: 'Raw Materials', sku: 'SYR-VAN', price: '$12.00', cost: '$4.80', margin: '60%', stock: 85, status: 'In Stock' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Products & BOM</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your finished goods, raw materials, and recipes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Layers className="w-4 h-4" />
            BOM Editor
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Total Products</h3>
          </div>
          <div className="text-2xl font-semibold text-neutral-900">1,248</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Active BOMs</h3>
          </div>
          <div className="text-2xl font-semibold text-neutral-900">342</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16"></iconify-icon>
            </div>
            <h3 className="text-sm font-medium text-neutral-600">Missing Ingredients</h3>
          </div>
          <div className="text-2xl font-semibold text-neutral-900">12</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products, SKUs..."
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
                <th className="px-6 py-3 font-medium">Product Name</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium text-right">Price</th>
                <th className="px-6 py-3 font-medium text-right">Cost</th>
                <th className="px-6 py-3 font-medium text-right">Margin</th>
                <th className="px-6 py-3 font-medium text-right">Stock</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{product.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{product.id}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 font-mono text-xs">{product.sku}</td>
                  <td className="px-6 py-4 text-neutral-600">{product.category}</td>
                  <td className="px-6 py-4 text-right font-medium text-neutral-900">{product.price}</td>
                  <td className="px-6 py-4 text-right text-neutral-600">{product.cost}</td>
                  <td className="px-6 py-4 text-right text-neutral-600">{product.margin}</td>
                  <td className="px-6 py-4 text-right font-medium text-neutral-900">{product.stock}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      product.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      product.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                      'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                    }`}>
                      {product.status}
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
          <div>Showing 1 to 5 of 1,248 products</div>
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
