import { z } from "zod";

import { MoneySchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export const PRICE_LIST_TYPES = ["PERCENT", "CUSTOM_RATES"] as const;
export const PriceListTypeSchema = z.enum(PRICE_LIST_TYPES);
export type PriceListType = z.infer<typeof PriceListTypeSchema>;

export const PRICE_LIST_TYPE_LABELS: Record<PriceListType, string> = {
  PERCENT: "Percent",
  CUSTOM_RATES: "Custom rates",
};

export const PriceListItemSchema = z.object({
  id: z.string().uuid(),
  price_list_id: z.string().uuid(),
  product_id: z.string().uuid(),
  rate: MoneySchema,
});
export type PriceListItem = z.infer<typeof PriceListItemSchema>;

export const PriceListSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  currency_id: z.string().uuid(),
  list_type: PriceListTypeSchema,
  percent: NullableDecimalStringSchema,
  is_active: z.boolean(),
  items: z.array(PriceListItemSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PriceList = z.infer<typeof PriceListSchema>;

export const PriceListListSchema = z.array(PriceListSchema);

export const PriceListCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  currency_id: z.string().uuid(),
  list_type: PriceListTypeSchema,
  percent: NullableDecimalStringSchema.optional(),
});
export type PriceListCreateRequest = z.infer<typeof PriceListCreateRequestSchema>;

export const PriceListUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  percent: NullableDecimalStringSchema.optional(),
  is_active: z.boolean().nullable().optional(),
});
export type PriceListUpdateRequest = z.infer<typeof PriceListUpdateRequestSchema>;

export const PriceListItemUpsertRequestSchema = z.object({
  product_id: z.string().uuid(),
  rate: MoneySchema,
});
export type PriceListItemUpsertRequest = z.infer<typeof PriceListItemUpsertRequestSchema>;

export const PriceListFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(150),
    currency_id: z.string().uuid("Select a currency"),
    list_type: PriceListTypeSchema,
    percent: z.string(),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.list_type === "PERCENT" && !values.percent.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["percent"],
        message: "Enter a percent",
      });
    }
  });
export type PriceListFormValues = z.infer<typeof PriceListFormSchema>;

export const PriceListEditFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  percent: z.string(),
  is_active: z.boolean(),
});
export type PriceListEditFormValues = z.infer<typeof PriceListEditFormSchema>;

export type PriceListListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  currency_id?: string;
  list_type?: PriceListType;
  is_active?: boolean;
};
