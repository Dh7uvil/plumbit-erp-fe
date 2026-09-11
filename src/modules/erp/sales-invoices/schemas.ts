import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  ConversionLineInputSchema,
  RelatedDocumentRefSchema,
} from "@/shared/components/document/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export const INVOICE_DOCUMENT_STATUSES = ["DRAFT", "POSTED", "CANCELLED"] as const;
export const InvoiceDocumentStatusSchema = z.enum(INVOICE_DOCUMENT_STATUSES);
export type InvoiceDocumentStatus = z.infer<typeof InvoiceDocumentStatusSchema>;

export const INVOICE_DOCUMENT_STATUS_LABELS: Record<InvoiceDocumentStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
};

export const INVOICE_DOCUMENT_STATUS_VARIANTS: Record<
  InvoiceDocumentStatus,
  "muted" | "success" | "destructive"
> = {
  DRAFT: "muted",
  POSTED: "success",
  CANCELLED: "destructive",
};

export const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"] as const;
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
};

export const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, "muted" | "warning" | "success"> = {
  UNPAID: "muted",
  PARTIALLY_PAID: "warning",
  PAID: "success",
};

export const COGS_STATUSES = ["NOT_APPLICABLE", "PENDING", "PARTIAL", "POSTED"] as const;
export const CogsStatusSchema = z.enum(COGS_STATUSES);
export type CogsStatus = z.infer<typeof CogsStatusSchema>;

export const COGS_STATUS_LABELS: Record<CogsStatus, string> = {
  NOT_APPLICABLE: "Not applicable",
  PENDING: "Pending",
  PARTIAL: "Partial",
  POSTED: "Posted",
};

export const PLACES_OF_SUPPLY = [
  "ABU_DHABI",
  "DUBAI",
  "SHARJAH",
  "AJMAN",
  "UMM_AL_QUWAIN",
  "RAS_AL_KHAIMAH",
  "FUJAIRAH",
  "OUTSIDE_UAE",
] as const;
export const PlaceOfSupplySchema = z.enum(PLACES_OF_SUPPLY);
export type PlaceOfSupply = z.infer<typeof PlaceOfSupplySchema>;

export const PLACE_OF_SUPPLY_LABELS: Record<PlaceOfSupply, string> = {
  ABU_DHABI: "Abu Dhabi",
  DUBAI: "Dubai",
  SHARJAH: "Sharjah",
  AJMAN: "Ajman",
  UMM_AL_QUWAIN: "Umm Al Quwain",
  RAS_AL_KHAIMAH: "Ras Al Khaimah",
  FUJAIRAH: "Fujairah",
  OUTSIDE_UAE: "Outside UAE",
};

export const DISCOUNT_TYPES = ["PERCENTAGE", "AMOUNT"] as const;
export const DiscountTypeSchema = z.enum(DISCOUNT_TYPES);
export type DiscountType = z.infer<typeof DiscountTypeSchema>;

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "Percentage",
  AMOUNT: "Amount",
};

export const TAX_TREATMENTS = ["REGISTERED", "UNREGISTERED", "EXPORT", "GCC", "EXEMPT"] as const;
export const TaxTreatmentSchema = z.enum(TAX_TREATMENTS);
export type TaxTreatment = z.infer<typeof TaxTreatmentSchema>;

export const TAX_TREATMENT_LABELS: Record<TaxTreatment, string> = {
  REGISTERED: "Registered",
  UNREGISTERED: "Unregistered",
  EXPORT: "Export",
  GCC: "GCC",
  EXEMPT: "Exempt",
};

export const SalesInvoiceLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  sales_order_line_id: z.string().uuid().nullable(),
  source_quotation_line_id: z.string().uuid().nullable().optional().default(null),
  source_proforma_invoice_line_id: z.string().uuid().nullable().optional().default(null),
  delivery_note_id: z.string().uuid().nullable(),
  delivery_note_line_id: z.string().uuid().nullable(),
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  tax_rate: MoneySchema,
  tax_amount: MoneySchema,
  amount: MoneySchema,
  income_account_id: z.string().uuid().nullable(),
  cogs_amount: MoneySchema,
  cogs_status: CogsStatusSchema,
  qty_credited: DecimalStringSchema,
});
export type SalesInvoiceLine = z.infer<typeof SalesInvoiceLineSchema>;

export const SalesInvoiceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string().optional(),
  status: InvoiceDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  invoice_date: z.string(),
  document_date: z.string(),
  customer_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  customer_trn: z.string().nullable(),
  branch_id: z.string().uuid().nullable(),
  salesperson_id: z.string().uuid().nullable(),
  sales_order_id: z.string().uuid().nullable(),
  source_quotation_id: z.string().uuid().nullable().optional().default(null),
  source_proforma_invoice_id: z.string().uuid().nullable().optional().default(null),
  payment_terms_id: z.string().uuid().nullable(),
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
  bill_to_snapshot: z.string().nullable(),
  ship_to_snapshot: z.string().nullable(),
  notes: z.string().nullable(),
  terms_and_conditions: z.string().nullable(),
  amount_paid: MoneySchema,
  amount_credited: MoneySchema,
  balance_due: MoneySchema,
  payment_status: PaymentStatusSchema,
  cogs_amount: MoneySchema,
  cogs_status: CogsStatusSchema,
  journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  export_evidence_ok: z.boolean(),
  export_evidence_checked_at: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  is_overdue: z.boolean().optional().default(false),
  is_partially_credited: z.boolean().optional().default(false),
  is_fully_credited: z.boolean().optional().default(false),
  available_actions: z.array(z.string()).default([]),
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  lines: z.array(SalesInvoiceLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SalesInvoice = z.infer<typeof SalesInvoiceSchema>;
export const SalesInvoiceListSchema = z.array(SalesInvoiceSchema);

export const SalesInvoiceLineInputSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  sales_order_line_id: z.string().uuid().nullable().optional(),
  delivery_note_id: z.string().uuid().nullable().optional(),
  delivery_note_line_id: z.string().uuid().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
});
export type SalesInvoiceLineInput = z.infer<typeof SalesInvoiceLineInputSchema>;

export const SalesInvoiceCreateRequestSchema = z.object({
  customer_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  salesperson_id: z.string().uuid().nullable().optional(),
  sales_order_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),
  terms_template_id: z.string().uuid().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.optional(),
  adjustment_amount: MoneySchema.optional(),
  round_off_amount: MoneySchema.optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(SalesInvoiceLineInputSchema),
});
export type SalesInvoiceCreateRequest = z.infer<typeof SalesInvoiceCreateRequestSchema>;

export const SalesInvoiceUpdateRequestSchema = z.object({
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  salesperson_id: z.string().uuid().nullable().optional(),
  sales_order_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.nullable().optional(),
  adjustment_amount: MoneySchema.nullable().optional(),
  round_off_amount: MoneySchema.nullable().optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(SalesInvoiceLineInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type SalesInvoiceUpdateRequest = z.infer<typeof SalesInvoiceUpdateRequestSchema>;

export const SalesInvoiceCreateFromSalesOrderSchema = z.object({
  sales_order_id: z.string().uuid(),
  invoice_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(ConversionLineInputSchema).nullable().optional(),
});
export type SalesInvoiceCreateFromSalesOrder = z.infer<
  typeof SalesInvoiceCreateFromSalesOrderSchema
>;

export const SalesInvoiceCreateFromDeliveryNotesSchema = z.object({
  delivery_note_ids: z.array(z.string().uuid()).min(1),
  invoice_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type SalesInvoiceCreateFromDeliveryNotes = z.infer<
  typeof SalesInvoiceCreateFromDeliveryNotesSchema
>;

export const SalesInvoiceMarginLineSchema = z.object({
  line_id: z.string().uuid(),
  line_number: z.number().int(),
  revenue: MoneySchema,
  cogs_amount: MoneySchema,
  cogs_status: CogsStatusSchema,
  margin: MoneySchema,
});
export type SalesInvoiceMarginLine = z.infer<typeof SalesInvoiceMarginLineSchema>;

export const SalesInvoiceMarginSchema = z.object({
  invoice_id: z.string().uuid(),
  revenue: MoneySchema,
  cogs_amount: MoneySchema,
  cogs_status: CogsStatusSchema,
  margin: MoneySchema,
  margin_percent: MoneySchema.nullable(),
  lines: z.array(SalesInvoiceMarginLineSchema).optional().default([]),
});
export type SalesInvoiceMargin = z.infer<typeof SalesInvoiceMarginSchema>;

export const SalesInvoiceLineFormSchema = z.object({
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  discount_type: z.string(),
  discount_value: z.string(),
  tax_id: z.string(),
  sales_order_line_id: z.string(),
  delivery_note_id: z.string(),
  delivery_note_line_id: z.string(),
});
export type SalesInvoiceLineFormValues = z.infer<typeof SalesInvoiceLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasProductId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankSalesInvoiceLine(line: SalesInvoiceLineFormValues): boolean {
  return !hasProductId(line.product_id) && !line.description.trim();
}

export const SalesInvoiceFormSchema = z
  .object({
    customer_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a customer"),
    contact_id: z.string(),
    branch_id: z.string(),
    invoice_date: z.string(),
    salesperson_id: z.string(),
    sales_order_id: z.string(),
    payment_terms_id: z.string(),
    currency_id: z.string(),
    notes: z.string(),
    terms_and_conditions: z.string(),
    terms_template_id: z.string(),
    discount_type: z.string(),
    discount_value: z.string(),
    shipping_amount: z.string(),
    adjustment_amount: z.string(),
    round_off_amount: z.string(),
    place_of_supply: z.string(),
    customer_trn: z.string(),
    tax_treatment: z.string(),
    bill_to_snapshot: z.string(),
    ship_to_snapshot: z.string(),
    lines: z.array(SalesInvoiceLineFormSchema),
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (isBlankSalesInvoiceLine(line)) {
        return;
      }
      if (!hasProductId(line.product_id) && !line.rate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "rate"],
          message: "Enter a rate",
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
export type SalesInvoiceFormValues = z.infer<typeof SalesInvoiceFormSchema>;

export type SalesInvoiceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: InvoiceDocumentStatus;
  customer_id?: string;
  sales_order_id?: string;
  branch_id?: string;
  currency_id?: string;
  payment_status?: PaymentStatus;
  invoice_date_from?: string;
  invoice_date_to?: string;
};

export function salesInvoiceDisplayNumber(
  invoice: Pick<SalesInvoice, "document_number" | "display_number">,
): string | null {
  const display = (invoice.display_number || "").trim();
  if (display) {
    return display;
  }
  const value = (invoice.document_number || "").trim();
  return value ? value : null;
}

export function isSalesInvoiceOverdue(invoice: SalesInvoice, today: string): boolean {
  if (invoice.is_overdue) {
    return true;
  }
  if (invoice.status !== "POSTED" || invoice.payment_status === "PAID" || !invoice.due_date) {
    return false;
  }
  return invoice.due_date < today;
}
