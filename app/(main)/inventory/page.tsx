'use client';

export default function InventoryPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Inventory</h1>
          <p className="text-sm text-neutral-500">Manage your raw materials and stock items.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm flex items-center gap-2 transition-colors">
            <iconify-icon icon="solar:export-linear" width="18" height="18"></iconify-icon>
            Export
          </button>
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 shadow-sm flex items-center gap-2 transition-colors">
            <iconify-icon icon="solar:add-circle-linear" width="18" height="18"></iconify-icon>
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <iconify-icon icon="solar:magnifer-linear" width="18" height="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"></iconify-icon>
            <input type="text" placeholder="Search items, SKU..." className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 w-64 transition-shadow" />
          </div>
          <select className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-shadow outline-none">
            <option>All Categories</option>
            <option>Dairy</option>
            <option>Bakery</option>
            <option>Packaging</option>
          </select>
          <select className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-shadow outline-none">
            <option>All Status</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
              <tr>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-right">Reorder Point</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <InventoryRow name="Whole Milk" sku="DAI-001" category="Dairy" stock="2" unit="L" reorder="10" status="Critical" />
              <InventoryRow name="Espresso Beans" sku="COF-001" category="Coffee" stock="12" unit="kg" reorder="5" status="In Stock" />
              <InventoryRow name="Croissant Dough" sku="BAK-002" category="Bakery" stock="15" unit="pcs" reorder="50" status="Warning" />
              <InventoryRow name="Paper Cups (8oz)" sku="PKG-001" category="Packaging" stock="120" unit="pcs" reorder="200" status="Warning" />
              <InventoryRow name="Vanilla Syrup" sku="SYR-003" category="Ingredients" stock="8" unit="btl" reorder="3" status="In Stock" />
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between text-sm text-neutral-500">
          <div>Showing 1 to 5 of 42 items</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 transition-colors" disabled>Previous</button>
            <button className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryRow({ name, sku, category, stock, unit, reorder, status }: any) {
  const isCritical = status === 'Critical';
  const isWarning = status === 'Warning';
  
  return (
    <tr className="hover:bg-neutral-50 transition-colors group">
      <td className="px-6 py-4 font-medium text-neutral-900">{name}</td>
      <td className="px-6 py-4 text-neutral-500">{sku}</td>
      <td className="px-6 py-4 text-neutral-500">{category}</td>
      <td className="px-6 py-4 text-right font-medium text-neutral-900">{stock} <span className="text-neutral-500 font-normal">{unit}</span></td>
      <td className="px-6 py-4 text-right text-neutral-500">{reorder} <span className="text-neutral-400">{unit}</span></td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isCritical ? 'bg-red-50 text-red-700 border border-red-100' : 
          isWarning ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
          'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-neutral-400 hover:text-neutral-900 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <iconify-icon icon="solar:menu-dots-bold" width="20" height="20"></iconify-icon>
        </button>
      </td>
    </tr>
  );
}
