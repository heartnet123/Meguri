import { describe, it, expect } from 'vitest';
import { anonymizeSalesData, forecastSchema } from '../convex/aiForecastingLogic';

describe('AI Forecasting Logic', () => {
  describe('Data Anonymization', () => {
    it('should strip PII (customer info) and keep only necessary fields', () => {
      const rawData = [
        {
          _id: 'mv_123',
          inventoryItemId: 'item_456',
          quantity: -5,
          type: 'sale',
          createdAt: 1700000000000,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          salePrice: 100,
        },
        {
          _id: 'mv_124',
          inventoryItemId: 'item_789',
          quantity: -10,
          type: 'sale',
          createdAt: 1700000000100,
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          salePrice: 200,
        }
      ];

      const anonymized = anonymizeSalesData(rawData as any);
      
      expect(anonymized.length).toBe(2);
      expect(anonymized[0]).toEqual({
        inventoryItemId: 'item_456',
        quantity: -5,
        type: 'sale',
        createdAt: 1700000000000,
      });
      expect(anonymized[1]).toEqual({
        inventoryItemId: 'item_789',
        quantity: -10,
        type: 'sale',
        createdAt: 1700000000100,
      });
      // Ensure PII does not exist
      expect((anonymized[0] as any).customerName).toBeUndefined();
      expect((anonymized[0] as any).customerEmail).toBeUndefined();
    });
  });

  describe('Forecast Schema', () => {
    it('should validate a valid forecast output', () => {
      const validData = {
        forecasts: [
          {
            inventoryItemId: 'item_456',
            periodDays: 7,
            predictedQty: 10,
            confidence: 'high',
            reasoning: 'Steady sales trend.',
          }
        ]
      };

      const result = forecastSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid forecast output', () => {
      const invalidData = {
        forecasts: [
          {
            inventoryItemId: 'item_456',
            // Missing periodDays
            predictedQty: -10, // Invalid quantity
            confidence: 'perfect', // Invalid confidence enum
          }
        ]
      };

      const result = forecastSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
