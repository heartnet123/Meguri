'use client';

export default function PurchasePlanningPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Purchase Planning</h1>
          <p className="text-sm text-neutral-500">AI-driven reorder recommendations and draft POs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm flex items-center gap-2 transition-colors">
            <iconify-icon icon="solar:document-text-linear" width="18" height="18"></iconify-icon>
            View Draft POs
          </button>
        </div>
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-xl p-6 text-white shadow-xl flex items-start gap-4">
        <div className="p-3 bg-white/10 rounded-xl shrink-0">
          <iconify-icon icon="solar:stars-linear" width="24" height="24"></iconify-icon>
        </div>
        <div>
          <h2 className="text-lg font-medium mb-1">Smart Recommendations Active</h2>
          <p className="text-neutral-300 text-sm max-w-3xl">
            Our AI has analyzed your sales history, current stock, and supplier lead times. 
            Below are the recommended items to order today to prevent stockouts over the next 7 days.
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">Urgent Reorders</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <ReorderCard 
            item="Whole Milk" 
            sku="DAI-001"
            supplier="Dairy Co."
            currentStock="2 L"
            forecast="25 L (Next 7 days)"
            leadTime="1 Day"
            recommendedQty="30 L"
            urgency="High"
            reason="Current stock is below safety threshold. Forecasted high demand for weekend lattes."
          />
          <ReorderCard 
            item="Croissant Dough" 
            sku="BAK-002"
            supplier="BakeMaster"
            currentStock="15 pcs"
            forecast="120 pcs (Next 7 days)"
            leadTime="2 Days"
            recommendedQty="150 pcs"
            urgency="High"
            reason="Lead time is 2 days. Order now to ensure stock for Saturday morning rush."
          />
        </div>

        <h3 className="text-lg font-medium text-neutral-900 pt-4">Upcoming Needs</h3>
        <div className="grid grid-cols-1 gap-4">
          <ReorderCard 
            item="Paper Cups (8oz)" 
            sku="PKG-001"
            supplier="EcoPack"
            currentStock="120 pcs"
            forecast="300 pcs (Next 14 days)"
            leadTime="5 Days"
            recommendedQty="500 pcs"
            urgency="Medium"
            reason="Long lead time (5 days). Order now to maintain safety stock next week."
          />
        </div>
      </div>
    </div>
  );
}

function ReorderCard({ item, sku, supplier, currentStock, forecast, leadTime, recommendedQty, urgency, reason }: any) {
  const isHigh = urgency === 'High';
  
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-medium text-neutral-900">{item}</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${isHigh ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                {urgency} Urgency
              </span>
            </div>
            <div className="text-sm text-neutral-500">{sku} • Supplier: {supplier}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-neutral-500 mb-1">Current Stock</div>
            <div className="text-sm font-medium text-neutral-900">{currentStock}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Forecast</div>
            <div className="text-sm font-medium text-neutral-900">{forecast}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Lead Time</div>
            <div className="text-sm font-medium text-neutral-900">{leadTime}</div>
          </div>
          <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
            <div className="text-xs text-neutral-500 mb-1">Recommended</div>
            <div className="text-base font-medium text-neutral-900">{recommendedQty}</div>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-sm text-neutral-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <iconify-icon icon="solar:info-circle-linear" width="18" height="18" className="text-blue-500 shrink-0 mt-0.5"></iconify-icon>
          {reason}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 justify-center md:border-l md:border-neutral-100 md:pl-6 min-w-[160px]">
        <button className="w-full bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm">
          Add to Draft PO
        </button>
        <button className="w-full bg-white text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 hover:bg-neutral-50 transition-colors">
          Edit Quantity
        </button>
        <button className="w-full text-neutral-500 px-4 py-2 rounded-lg text-sm font-medium hover:text-neutral-900 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}
