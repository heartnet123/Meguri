import assert from 'node:assert/strict';

import {
  getAlertCategory,
  getAlertHref,
  matchesAlertFilters,
} from '../lib/alerts/inbox.js';

assert.equal(getAlertCategory('low_stock'), 'stock');
assert.equal(getAlertCategory('unusual_demand'), 'anomaly');

assert.equal(
  getAlertHref({
    type: 'low_stock',
    relatedItemId: 'item_123',
  }),
  '/inventory?highlight=item_123'
);

assert.equal(
  getAlertHref({
    type: 'unusual_demand',
  }),
  '/dashboard?alertType=unusual_demand'
);

assert.equal(
  matchesAlertFilters(
    {
      title: 'Low Stock: Whole Milk',
      description: 'Stock level for Whole Milk is below minimum.',
      severity: 'critical',
      status: 'open',
      category: 'stock',
    },
    {
      search: 'whole milk',
      severity: 'critical',
      status: 'open',
      category: 'stock',
    }
  ),
  true
);

assert.equal(
  matchesAlertFilters(
    {
      title: 'Demand spike detected',
      description: 'Yesterday sales were unusually high.',
      severity: 'high',
      status: 'resolved',
      category: 'anomaly',
    },
    {
      search: '',
      severity: '',
      status: 'open',
      category: '',
    }
  ),
  false
);

console.log('alerts-inbox assertions passed');
