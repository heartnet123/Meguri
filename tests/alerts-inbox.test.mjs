import { describe, expect, it } from 'vitest';

import {
  getAlertCategory,
  getAlertHref,
  matchesAlertFilters,
} from '../lib/alerts/inbox.js';

describe('alerts inbox helpers', () => {
  it('maps alert types to categories', () => {
    expect(getAlertCategory('low_stock')).toBe('stock');
    expect(getAlertCategory('unusual_demand')).toBe('anomaly');
  });

  it('builds alert destination links', () => {
    expect(
      getAlertHref({
        type: 'low_stock',
        relatedItemId: 'item_123',
      })
    ).toBe('/inventory?highlight=item_123');

    expect(
      getAlertHref({
        type: 'unusual_demand',
      })
    ).toBe('/dashboard?alertType=unusual_demand');
  });

  it('matches alerts against inbox filters', () => {
    expect(
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
      )
    ).toBe(true);

    expect(
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
      )
    ).toBe(false);
  });
});
