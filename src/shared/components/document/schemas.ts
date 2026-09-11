import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export const ConversionLineInputSchema = z.object({
  source_line_id: z.string().uuid(),
  quantity: DecimalStringSchema,
});
export type ConversionLineInput = z.infer<typeof ConversionLineInputSchema>;

export const RelatedDocumentRefSchema = z.object({
  document_type: z.string(),
  document_id: z.string().uuid(),
  document_number: z.string(),
  status: z.string(),
  relationship: z.string(),
  document_date: z.string().nullable().optional().default(null),
  quantity_summary: z.string().nullable().optional().default(null),
});
export type RelatedDocumentRef = z.infer<typeof RelatedDocumentRefSchema>;

export const QuantityProgressSchema = z.object({
  ordered: DecimalStringSchema,
  fulfilled: DecimalStringSchema,
  invoiced: DecimalStringSchema,
  remaining_to_fulfill: DecimalStringSchema,
  remaining_to_invoice: DecimalStringSchema,
});
export type QuantityProgress = z.infer<typeof QuantityProgressSchema>;

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
  net_weight: z.string(),
  gross_weight: z.string(),
  purchase_order_line_id: z.string(),
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
    net_weight: "",
    gross_weight: "",
    purchase_order_line_id: "",
  };
}

export const EXPENSE_CATEGORIES = [
  "FREIGHT",
  "CUSTOMS_DUTY",
  "INSURANCE",
  "CLEARING",
  "INSPECTION",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FREIGHT: "Freight",
  CUSTOMS_DUTY: "Customs duty",
  INSURANCE: "Insurance",
  CLEARING: "Clearing",
  INSPECTION: "Inspection",
  OTHER: "Other",
};

export type ExpenseDocumentLineFormValues = DocumentLineFormValues & {
  line_type: "EXPENSE";
  expense_account_id: string;
  expense_category: string;
};

export function emptyExpenseDocumentLine(): ExpenseDocumentLineFormValues {
  return {
    ...emptyDocumentLine(),
    line_type: "EXPENSE",
    expense_account_id: OPTIONAL_SELECT_NONE,
    expense_category: OPTIONAL_SELECT_NONE,
  };
}
