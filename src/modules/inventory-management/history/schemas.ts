import { z } from "zod";

import { DecimalStringSchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export const TradingHistoryLineSchema = z.object({
  document_id: z.string().uuid(),
  document_number: z.string(),
  document_date: z.string(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  sku: z.string(),
  party_id: z.string().uuid(),
  party_name: z.string(),
  warehouse_id: z.string().uuid(),
  quantity: DecimalStringSchema,
  rate: DecimalStringSchema,
  unit_cost: NullableDecimalStringSchema.optional().default(null),
  margin: NullableDecimalStringSchema.optional().default(null),
  posted_by: z.string().uuid().nullable().optional().default(null),
  salesperson_id: z.string().uuid().nullable().optional().default(null),
  invoiced_quantity: NullableDecimalStringSchema.optional().default(null),
  revenue: NullableDecimalStringSchema.optional().default(null),
  billed_cost: NullableDecimalStringSchema.optional().default(null),
});
export type TradingHistoryLine = z.infer<typeof TradingHistoryLineSchema>;
export const TradingHistoryLineListSchema = z.array(TradingHistoryLineSchema);

export const TradingPartyAggregateSchema = z.object({
  party_id: z.string().uuid(),
  party_name: z.string(),
  total_quantity: DecimalStringSchema,
  dispatch_count: z.number().int(),
  first_date: z.string(),
  last_date: z.string(),
  last_rate: DecimalStringSchema,
  last_posted_by: z.string().uuid().nullable().optional().default(null),
  salesperson_id: z.string().uuid().nullable().optional().default(null),
  invoiced_quantity: NullableDecimalStringSchema.optional().default(null),
  revenue: NullableDecimalStringSchema.optional().default(null),
});
export type TradingPartyAggregate = z.infer<typeof TradingPartyAggregateSchema>;
export const TradingPartyAggregateListSchema = z.array(TradingPartyAggregateSchema);

export const TradingProductAggregateSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  sku: z.string(),
  total_quantity: DecimalStringSchema,
  dispatch_count: z.number().int(),
  first_date: z.string(),
  last_date: z.string(),
  last_rate: DecimalStringSchema,
  last_posted_by: z.string().uuid().nullable().optional().default(null),
  salesperson_id: z.string().uuid().nullable().optional().default(null),
  invoiced_quantity: NullableDecimalStringSchema.optional().default(null),
  revenue: NullableDecimalStringSchema.optional().default(null),
});
export type TradingProductAggregate = z.infer<typeof TradingProductAggregateSchema>;
export const TradingProductAggregateListSchema = z.array(TradingProductAggregateSchema);

export type TradingHistoryListParams = {
  page?: number;
  page_size?: number;
  party_id?: string;
  product_id?: string;
  warehouse_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};
