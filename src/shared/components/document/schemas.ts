import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export const DocumentBaseSchema = z.object({
  id: z.string().uuid(),
  document_number: z.string(),
  status: z.string(),
  version: z.number().int(),
  is_posted: z.boolean(),
  available_actions: z.array(z.string()).default([]),
});
export type DocumentBase = z.infer<typeof DocumentBaseSchema>;

export const DocumentTotalsSchema = z.object({
  subtotal: MoneySchema,
  discount_amount: MoneySchema,
  tax_amount: MoneySchema,
  grand_total: MoneySchema,
  foreign_amount: MoneySchema,
  base_amount: MoneySchema,
  exchange_rate: MoneySchema,
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
});
export type DocumentTotals = z.infer<typeof DocumentTotalsSchema>;

export const DocumentLineBaseSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  discount_type: z.string().nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  tax_rate: MoneySchema,
  tax_amount: MoneySchema,
  amount: MoneySchema,
});
export type DocumentLineBase = z.infer<typeof DocumentLineBaseSchema>;

export const DISCOUNT_TYPES = ["PERCENTAGE", "AMOUNT"] as const;
export const DISCOUNT_TYPE_LABELS: Record<(typeof DISCOUNT_TYPES)[number], string> = {
  PERCENTAGE: "Percentage",
  AMOUNT: "Amount",
};

export const DocumentLineFormSchema = z.object({
  product_id: z.string(),
  supplier_product_id: z.string(),
  supplier_sku: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  discount_type: z.string(),
  discount_value: z.string(),
  tax_id: z.string(),
});
export type DocumentLineFormValues = z.infer<typeof DocumentLineFormSchema>;

export function emptyDocumentLine(): DocumentLineFormValues {
  return {
    product_id: OPTIONAL_SELECT_NONE,
    supplier_product_id: OPTIONAL_SELECT_NONE,
    supplier_sku: "",
    description: "",
    quantity: "1",
    unit_id: OPTIONAL_SELECT_NONE,
    rate: "",
    discount_type: OPTIONAL_SELECT_NONE,
    discount_value: "",
    tax_id: OPTIONAL_SELECT_NONE,
  };
}
