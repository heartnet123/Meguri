const STOCK_TYPES = new Set(['low_stock', 'price_change']);
const ANOMALY_TYPES = new Set(['unusual_demand']);

export function getAlertCategory(type) {
  if (ANOMALY_TYPES.has(type)) return 'anomaly';
  if (STOCK_TYPES.has(type)) return 'stock';
  if (type === 'supplier') return 'supplier';
  return 'system';
}

export function getAlertHref(alert) {
  if (alert.type === 'low_stock' && alert.relatedItemId) {
    return `/inventory?highlight=${encodeURIComponent(alert.relatedItemId)}`;
  }

  if (alert.type === 'supplier' && alert.relatedEntityId) {
    return `/suppliers?highlight=${encodeURIComponent(alert.relatedEntityId)}`;
  }

  if (alert.type === 'unusual_demand') {
    return '/dashboard?alertType=unusual_demand';
  }

  return '/alerts';
}

export function matchesAlertFilters(alert, filters) {
  const search = (filters.search ?? '').trim().toLowerCase();

  if (search) {
    const haystack = `${alert.title} ${alert.description}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  if (filters.severity && alert.severity !== filters.severity) return false;
  if (filters.status && alert.status !== filters.status) return false;
  if (filters.category && alert.category !== filters.category) return false;

  return true;
}
