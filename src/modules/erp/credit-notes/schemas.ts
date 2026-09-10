import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  DiscountTypeSchema,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  InvoiceDocumentStatusSchema,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  PlaceOfSupplySchema,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  TaxTreatmentSchema,
  type DiscountType,
  type InvoiceDocumentStatus,
  type PlaceOfSupply,
} from "@/modules/erp/sales-invoices/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
};
export type { DiscountType, InvoiceDocumentStatus, PlaceOfSupply };

export const CREDIT_NOTE_REASONS = [
  "GOODS_RETURNED",
  "PRICE_ADJUSTMENT",
  "SHORT_SHIPMENT",
  "QUALITY_CLAIM",
  "CANCELLATION",
] as const;
export const CreditNoteReasonSchema = z.enum(CREDIT_NOTE_REASONS);
export type CreditNoteReason = z.infer<typeof CreditNoteReasonSchema>;

export const CREDIT_NOTE_REASON_LABELS: Record<CreditNoteReason, string> = {
  GOODS_RETURNED: "Goods returned",
  PRICE_ADJUSTMENT: "Price adjustment",
  SHORT_SHIPMENT: "Short shipment",
  QUALITY_CLAIM: "Quality claim",
  CANCELLATION: "Cancellation",
};

export const CreditNoteLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  sales_invoice_line_id: z.string().uuid().nullable(),
  sales_return_line_id: z.string().uuid().nullable(),
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  tax_rate: MoneySchema,
  tax_amount: MoneySchema,
  amount: MoneySchema,
  income_account_id: z.string().uuid().nullable(),
});
export type CreditNoteLine = z.infer<typeof CreditNoteLineSchema>;

export const CreditNoteSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string().optional(),
  status: InvoiceDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  credit_note_date: z.string(),
  document_date: z.string(),
  customer_id: z.string().uuid(),
  sales_invoice_id: z.string().uuid().nullable(),
  sales_return_id: z.string().uuid().nullable(),
  reason_code: CreditNoteReasonSchema,
  branch_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  place_of_supply: PlaceOfSupplySchema,
  is_export: z.boolean(),
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  shipping_amount: MoneySchema,
  adjustment_amount: MoneySchema,
  round_off_amount: MoneySchema,
  subtotal: MoneySchema,
  tax_amount: MoneySchema,
  grand_total: MoneySchema,
  foreign_amount: MoneySchema,
  base_amount: MoneySchema,
  notes: z.string().nullable(),
  amount_applied: MoneySchema,
  amount_unapplied: MoneySchema,
  journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  lines: z.array(CreditNoteLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CreditNote = z.infer<typeof CreditNoteSchema>;
export const CreditNoteListSchema = z.array(CreditNoteSchema);

export const CreditNoteLineInputSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  sales_invoice_line_id: z.string().uuid().nullable().optional(),
  sales_return_line_id: z.string().uuid().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  income_account_id: z.string().uuid().nullable().optional(),
});
export type CreditNoteLineInput = z.infer<typeof CreditNoteLineInputSchema>;

export const CreditNoteCreateRequestSchema = z.object({
  customer_id: z.string().uuid(),
  sales_invoice_id: z.string().uuid().nullable().optional(),
  sales_return_id: z.string().uuid().nullable().optional(),
  reason_code: CreditNoteReasonSchema,
  branch_id: z.string().uuid().nullable().optional(),
  credit_note_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.optional(),
  adjustment_amount: MoneySchema.optional(),
  round_off_amount: MoneySchema.optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(CreditNoteLineInputSchema),
});
export type CreditNoteCreateRequest = z.infer<typeof CreditNoteCreateRequestSchema>;

export const CreditNoteUpdateRequestSchema = z.object({
  sales_invoice_id: z.string().uuid().nullable().optional(),
  sales_return_id: z.string().uuid().nullable().optional(),
  reason_code: CreditNoteReasonSchema.nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  credit_note_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.nullable().optional(),
  adjustment_amount: MoneySchema.nullable().optional(),
  round_off_amount: MoneySchema.nullable().optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(CreditNoteLineInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type CreditNoteUpdateRequest = z.infer<typeof CreditNoteUpdateRequestSchema>;

export const CreditNoteCreateFromSalesInvoiceSchema = z.object({
  sales_invoice_id: z.string().uuid(),
  credit_note_date: z.string().nullable().optional(),
  reason_code: CreditNoteReasonSchema.optional(),
  notes: z.string().nullable().optional(),
});
export type CreditNoteCreateFromSalesInvoice = z.infer<
  typeof CreditNoteCreateFromSalesInvoiceSchema
>;

export const CreditNoteCreateFromSalesReturnSchema = z.object({
  sales_return_id: z.string().uuid(),
  credit_note_date: z.string().nullable().optional(),
  reason_code: CreditNoteReasonSchema.optional(),
  notes: z.string().nullable().optional(),
});
export type CreditNoteCreateFromSalesReturn = z.infer<typeof CreditNoteCreateFromSalesReturnSchema>;

export const CreditNoteLineFormSchema = z.object({
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  discount_type: z.string(),
  discount_value: z.string(),
  tax_id: z.string(),
  sales_invoice_line_id: z.string().optional(),
  sales_return_line_id: z.string().optional(),
});
export type CreditNoteLineFormValues = z.infer<typeof CreditNoteLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasProductId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankCreditNoteLine(line: CreditNoteLineFormValues): boolean {
  return !hasProductId(line.product_id) && !line.description.trim();
}

export const CreditNoteFormSchema = z
  .object({
    customer_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a customer"),
    sales_invoice_id: z.string(),
    sales_return_id: z.string(),
    reason_code: CreditNoteReasonSchema,
    branch_id: z.string(),
    credit_note_date: z.string(),
    currency_id: z.string(),
    notes: z.string(),
    discount_type: z.string(),
    discount_value: z.string(),
    shipping_amount: z.string(),
    adjustment_amount: z.string(),
    round_off_amount: z.string(),
    place_of_supply: z.string(),
    lines: z.array(CreditNoteLineFormSchema),
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (isBlankCreditNoteLine(line)) {
        return;
      }
      if (!POSITIVE_DECIMAL.test(line.quantity.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "quantity"],
          message: "Enter a quantity greater than 0",
        });
      }
    });
  });
export type CreditNoteFormValues = z.infer<typeof CreditNoteFormSchema>;

export type CreditNoteListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: InvoiceDocumentStatus;
  customer_id?: string;
  sales_invoice_id?: string;
  sales_return_id?: string;
  currency_id?: string;
  credit_note_date_from?: string;
  credit_note_date_to?: string;
};

export function creditNoteDisplayNumber(
  note: Pick<CreditNote, "document_number" | "display_number">,
): string | null {
  const display = (note.display_number || "").trim();
  if (display) {
    return display;
  }
  const value = (note.document_number || "").trim();
  return value ? value : null;
}
