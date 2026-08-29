import { z } from "zod";

export const CurrencySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimal_places: z.number().int(),
  is_base: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Currency = z.infer<typeof CurrencySchema>;

export const CurrencyListSchema = z.array(CurrencySchema);

export const CurrencyCreateRequestSchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  decimal_places: z.number().int().min(0).max(6).optional(),
  is_base: z.boolean().optional(),
});
export type CurrencyCreateRequest = z.infer<typeof CurrencyCreateRequestSchema>;

export const CurrencyUpdateRequestSchema = z.object({
  name: z.string().min(1).max(100).nullable().optional(),
  symbol: z.string().min(1).max(10).nullable().optional(),
  decimal_places: z.number().int().min(0).max(6).nullable().optional(),
  is_base: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type CurrencyUpdateRequest = z.infer<typeof CurrencyUpdateRequestSchema>;

export const CurrencyFormSchema = z.object({
  code: z.string().length(3, "Use a 3-letter code"),
  name: z.string().min(1, "Enter a name").max(100),
  symbol: z.string().min(1, "Enter a symbol").max(10),
  decimal_places: z.number().int().min(0).max(6),
  is_base: z.boolean(),
  is_active: z.boolean(),
});
export type CurrencyFormValues = z.infer<typeof CurrencyFormSchema>;

export type CurrencyListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_base?: boolean;
  is_active?: boolean;
};
