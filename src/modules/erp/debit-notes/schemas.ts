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
import { RelatedDocumentRefSchema } from "@/shared/components/document/schemas";
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

export const DEBIT_NOTE_REASONS = [
  "GOODS_REJECTED",
  "PRICE_ADJUSTMENT",
  "SHORT_RECEIPT",
  "QUALITY_CLAIM",
] as const;
export const DebitNoteReasonSchema = z.enum(DEBIT_NOTE_REASONS);
export type DebitNoteReason = z.infer<typeof DebitNoteReasonSchema>;

export const DEBIT_NOTE_REASON_LABELS: Record<DebitNoteReason, string> = {
  GOODS_REJECTED: "Goods rejected",
  PRICE_ADJUSTMENT: "Price adjustment",
  SHORT_RECEIPT: "Short receipt",
  QUALITY_CLAIM: "Quality claim",
};

export const DebitNoteLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  purchase_invoice_line_id: z.string().uuid(),
  expense_account_id: z.string().uuid().nullable(),
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  tax_rate: MoneySchema,
  tax_amount: MoneySchema,
  amount: MoneySchema,
});
export type DebitNoteLine = z.infer<typeof DebitNoteLineSchema>;

export const DebitNoteSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string().optional(),
  status: InvoiceDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  debit_note_date: z.string(),
  document_date: z.string(),
  purchase_invoice_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  reason_code: DebitNoteReasonSchema,
  branch_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  place_of_supply: PlaceOfSupplySchema,
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
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  lines: z.array(DebitNoteLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DebitNote = z.infer<typeof DebitNoteSchema>;
export const DebitNoteListSchema = z.array(DebitNoteSchema);

export const DebitNoteLineInputSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema.optional(),
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  purchase_invoice_line_id: z.string().uuid(),
  expense_account_id: z.string().uuid().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
});
export type DebitNoteLineInput = z.infer<typeof DebitNoteLineInputSchema>;

export const DebitNoteCreateRequestSchema = z.object({
  purchase_invoice_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  reason_code: DebitNoteReasonSchema,
  branch_id: z.string().uuid().nullable().optional(),
  debit_note_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.optional(),
  adjustment_amount: MoneySchema.optional(),
  round_off_amount: MoneySchema.optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(DebitNoteLineInputSchema),
});
export type DebitNoteCreateRequest = z.infer<typeof DebitNoteCreateRequestSchema>;

export const DebitNoteUpdateRequestSchema = z.object({
  reason_code: DebitNoteReasonSchema.nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  debit_note_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.nullable().optional(),
  adjustment_amount: MoneySchema.nullable().optional(),
  round_off_amount: MoneySchema.nullable().optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(DebitNoteLineInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type DebitNoteUpdateRequest = z.infer<typeof DebitNoteUpdateRequestSchema>;

export const DebitNoteCreateFromPurchaseInvoiceSchema = z.object({
  purchase_invoice_id: z.string().uuid(),
  debit_note_date: z.string().nullable().optional(),
  reason_code: DebitNoteReasonSchema.optional(),
  notes: z.string().nullable().optional(),
});
export type DebitNoteCreateFromPurchaseInvoice = z.infer<
  typeof DebitNoteCreateFromPurchaseInvoiceSchema
>;

export const DebitNoteCreateFromPurchaseReturnSchema = z.object({
  purchase_return_id: z.string().uuid(),
  debit_note_date: z.string().nullable().optional(),
  reason_code: DebitNoteReasonSchema.optional(),
  notes: z.string().nullable().optional(),
});
export type DebitNoteCreateFromPurchaseReturn = z.infer<
  typeof DebitNoteCreateFromPurchaseReturnSchema
>;

export const DebitNoteLineFormSchema = z.object({
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  discount_type: z.string(),
  discount_value: z.string(),
  tax_id: z.string(),
  purchase_invoice_line_id: z.string().optional(),
  expense_account_id: z.string().optional(),
});
export type DebitNoteLineFormValues = z.infer<typeof DebitNoteLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankDebitNoteLine(line: DebitNoteLineFormValues): boolean {
  return (
    !hasId(line.product_id) && !line.description.trim() && !hasId(line.expense_account_id ?? "")
  );
}

export const DebitNoteFormSchema = z
  .object({
    purchase_invoice_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a bill"),
    supplier_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a supplier"),
    reason_code: DebitNoteReasonSchema,
    branch_id: z.string(),
    debit_note_date: z.string(),
    currency_id: z.string(),
    notes: z.string(),
    discount_type: z.string(),
    discount_value: z.string(),
    shipping_amount: z.string(),
    adjustment_amount: z.string(),
    round_off_amount: z.string(),
    place_of_supply: z.string(),
    lines: z.array(DebitNoteLineFormSchema),
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (isBlankDebitNoteLine(line)) {
        return;
      }
      if (!hasId(line.purchase_invoice_line_id ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "purchase_invoice_line_id"],
          message: "Line must come from the purchase invoice",
        });
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
export type DebitNoteFormValues = z.infer<typeof DebitNoteFormSchema>;

export type DebitNoteListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: InvoiceDocumentStatus;
  supplier_id?: string;
  purchase_invoice_id?: string;
  currency_id?: string;
  debit_note_date_from?: string;
  debit_note_date_to?: string;
};

export function debitNoteDisplayNumber(
  note: Pick<DebitNote, "document_number" | "display_number">,
): string | null {
  const display = (note.display_number || "").trim();
  if (display) {
    return display;
  }
  const value = (note.document_number || "").trim();
  return value ? value : null;
}
