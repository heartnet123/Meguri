import { z } from 'zod';

export const forecastSchema = z.object({
  forecasts: z.array(
    z.object({
      inventoryItemId: z.string(),
      periodDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
      predictedQty: z.number().nonnegative(),
      confidence: z.union([z.literal('high'), z.literal('medium'), z.literal('low')]),
      reasoning: z.string().describe('Explanation of why this forecast was chosen'),
    })
  )
});

export type ForecastSchemaType = z.infer<typeof forecastSchema>;

export function anonymizeSalesData(movements: any[]) {
  return movements.map(({ inventoryItemId, quantity, type, createdAt }) => ({
    inventoryItemId,
    quantity,
    type,
    createdAt,
  }));
}
