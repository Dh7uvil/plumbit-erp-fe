import { z } from "zod";

import { MoneySchema } from "@/shared/lib/money";

export const ExchangeRateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  from_currency_id: z.string().uuid(),
  to_currency_id: z.string().uuid(),
  effective_date: z.string(),
  rate: MoneySchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

export const ExchangeRateListSchema = z.array(ExchangeRateSchema);

export const ExchangeRateUpsertRequestSchema = z.object({
  currency_id: z.string().uuid(),
  rate_to_base: MoneySchema,
  effective_date: z.string().nullable().optional(),
});
export type ExchangeRateUpsertRequest = z.infer<typeof ExchangeRateUpsertRequestSchema>;

export const ExchangeRateResolveSchema = z.object({
  from_currency_id: z.string().uuid(),
  to_currency_id: z.string().uuid(),
  effective_date: z.string(),
  rate: MoneySchema,
});
export type ExchangeRateResolve = z.infer<typeof ExchangeRateResolveSchema>;

export const ExchangeRateFormSchema = z.object({
  currency_id: z.string().uuid("Select a currency"),
  rate_to_base: z.string().min(1, "Enter a rate"),
  effective_date: z.string(),
});
export type ExchangeRateFormValues = z.infer<typeof ExchangeRateFormSchema>;

export type ExchangeRateListParams = {
  effective_date?: string;
};

export type ExchangeRateResolveParams = {
  from_currency_id: string;
  on_date?: string;
};
