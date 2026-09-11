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
  amount_summary: z.string().nullable().optional().default(null),
});
export type RelatedDocumentRef = z.infer<typeof RelatedDocumentRefSchema>;

export const DocumentWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional().default({}),
});
export type DocumentWarning = z.infer<typeof DocumentWarningSchema>;

export const OPEN_ITEM_TYPES = [
  "SALES_INVOICE",
  "PURCHASE_INVOICE",
  "CREDIT_NOTE",
  "DEBIT_NOTE",
  "OPENING_AR",
  "OPENING_AP",
  "CUSTOMER_PAYMENT",
  "SUPPLIER_PAYMENT",
] as const;
export const OpenItemTypeSchema = z.enum(OPEN_ITEM_TYPES);
export type OpenItemType = z.infer<typeof OpenItemTypeSchema>;

export const OPEN_ITEM_TYPE_LABELS: Record<OpenItemType, string> = {
  SALES_INVOICE: "Sales invoice",
  PURCHASE_INVOICE: "Purchase invoice",
  CREDIT_NOTE: "Credit note",
  DEBIT_NOTE: "Debit note",
  OPENING_AR: "Opening AR",
  OPENING_AP: "Opening AP",
  CUSTOMER_PAYMENT: "Customer receipt",
  SUPPLIER_PAYMENT: "Supplier payment",
};

export const OpenItemRowSchema = z.object({
  item_type: OpenItemTypeSchema,
  document_id: z.string(),
  document_number: z.string(),
  document_date: z.string(),
  due_date: z.string().nullable().optional().default(null),
  currency_id: z.string(),
  original_amount: MoneySchema,
  balance: MoneySchema,
  is_debit: z.boolean(),
  exchange_rate: MoneySchema.nullable().optional().default(null),
});
export type OpenItemRow = z.infer<typeof OpenItemRowSchema>;
export const OpenItemRowListSchema = z.array(OpenItemRowSchema);

export const PaymentAllocationInputSchema = z.object({
  item_type: OpenItemTypeSchema,
  item_id: z.string().uuid(),
  amount: MoneySchema,
});
export type PaymentAllocationInput = z.infer<typeof PaymentAllocationInputSchema>;

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

export const PartyPaymentHistoryItemSchema = z.object({
  id: z.string().uuid(),
  document_number: z.string().optional().default(""),
  display_number: z.string().optional().default(""),
  payment_date: z.string(),
  status: z.string(),
  amount_received: z.string().optional(),
  amount_paid: z.string().optional(),
});
export const PartyPaymentHistoryListSchema = z.array(PartyPaymentHistoryItemSchema);
export type PartyPaymentHistoryItem = z.infer<typeof PartyPaymentHistoryItemSchema>;

export const PackingLineResponseFields = {
  carton_qty: z.string().nullable().optional().default(null),
  packing_unit: z.string().nullable().optional().default(null),
  cbm: z.string().nullable().optional().default(null),
  weight: z.string().nullable().optional().default(null),
  item_code: z.string().nullable().optional().default(null),
};

export const PackingLineInputFields = {
  carton_qty: DecimalStringSchema.nullable().optional(),
  packing_unit: z.string().nullable().optional(),
  cbm: DecimalStringSchema.nullable().optional(),
  weight: DecimalStringSchema.nullable().optional(),
  item_code: z.string().nullable().optional(),
};

export const PackingLineFormFieldsSchema = z.object({
  carton_qty: z.string(),
  packing_unit: z.string(),
  cbm: z.string(),
  weight: z.string(),
  item_code: z.string(),
});

export function emptyPackingLineForm() {
  return {
    carton_qty: "",
    packing_unit: "",
    cbm: "",
    weight: "",
    item_code: "",
  };
}

export function packingFromLine(line: {
  carton_qty?: string | null;
  packing_unit?: string | null;
  cbm?: string | null;
  weight?: string | null;
  item_code?: string | null;
}) {
  return {
    carton_qty: line.carton_qty ?? "",
    packing_unit: line.packing_unit ?? "",
    cbm: line.cbm ?? "",
    weight: line.weight ?? "",
    item_code: line.item_code ?? "",
  };
}

export function packingLineInput(values: {
  carton_qty?: string;
  packing_unit?: string;
  cbm?: string;
  weight?: string;
  item_code?: string;
}) {
  function emptyToNull(value: string | undefined): string | null {
    const trimmed = value?.trim() ?? "";
    return trimmed ? trimmed : null;
  }
  return {
    carton_qty: emptyToNull(values.carton_qty),
    packing_unit: emptyToNull(values.packing_unit),
    cbm: emptyToNull(values.cbm),
    weight: emptyToNull(values.weight),
    item_code: emptyToNull(values.item_code),
  };
}

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
  carton_qty: z.string(),
  packing_unit: z.string(),
  cbm: z.string(),
  weight: z.string(),
  item_code: z.string(),
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
    ...emptyPackingLineForm(),
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
