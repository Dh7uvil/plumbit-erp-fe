import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  InvoiceDocumentStatusSchema,
  type InvoiceDocumentStatus,
} from "@/modules/erp/sales-invoices/schemas";
import {
  OpenItemTypeSchema,
  PaymentAllocationInputSchema,
  RelatedDocumentRefSchema,
} from "@/shared/components/document/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
};
export type { InvoiceDocumentStatus };

export const PAYMENT_METHODS = [
  "BANK",
  "CASH",
  "UPI",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "CHEQUE",
  "ONLINE",
  "TT",
  "OTHER",
] as const;
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK: "Bank",
  CASH: "Cash",
  UPI: "UPI",
  CREDIT_CARD: "Credit card",
  DEBIT_CARD: "Debit card",
  CHEQUE: "Cheque",
  ONLINE: "Online",
  TT: "Telegraphic transfer",
  OTHER: "Other",
};

export const CustomerPaymentAllocationSchema = z.object({
  item_type: z.string(),
  item_id: z.string().uuid(),
  amount: MoneySchema,
  journal_entry_id: z.string().uuid().nullable().optional().default(null),
});
export type CustomerPaymentAllocation = z.infer<typeof CustomerPaymentAllocationSchema>;

export const CustomerPaymentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string().optional(),
  status: InvoiceDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  payment_date: z.string(),
  document_date: z.string(),
  customer_id: z.string().uuid(),
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  amount_received: MoneySchema,
  bank_charges: MoneySchema,
  amount_unapplied: MoneySchema,
  amount_refunded: MoneySchema,
  payment_account_id: z.string().uuid(),
  payment_method: PaymentMethodSchema,
  reference: z.string().nullable(),
  proforma_invoice_id: z.string().uuid().nullable(),
  sales_order_id: z.string().uuid().nullable(),
  journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  refund_journal_entry_id: z.string().uuid().nullable(),
  realized_fx_amount: MoneySchema.nullable().optional().default(null),
  tax_id: z.string().uuid().nullable(),
  tax_amount: MoneySchema,
  notes: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  refunded_at: z.string().nullable(),
  refunded_by: z.string().uuid().nullable(),
  available_actions: z.array(z.string()).default([]),
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  allocations: z.array(CustomerPaymentAllocationSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CustomerPayment = z.infer<typeof CustomerPaymentSchema>;
export const CustomerPaymentListSchema = z.array(CustomerPaymentSchema);

export const CustomerPaymentCreateRequestSchema = z.object({
  customer_id: z.string().uuid(),
  payment_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  amount_received: MoneySchema,
  bank_charges: MoneySchema.optional(),
  payment_account_id: z.string().uuid(),
  payment_method: PaymentMethodSchema.optional(),
  reference: z.string().nullable().optional(),
  proforma_invoice_id: z.string().uuid().nullable().optional(),
  sales_order_id: z.string().uuid().nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  allocations: z.array(PaymentAllocationInputSchema).optional(),
});
export type CustomerPaymentCreateRequest = z.infer<typeof CustomerPaymentCreateRequestSchema>;

export const CustomerPaymentUpdateRequestSchema = z.object({
  payment_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  amount_received: MoneySchema.nullable().optional(),
  bank_charges: MoneySchema.nullable().optional(),
  payment_account_id: z.string().uuid().nullable().optional(),
  payment_method: PaymentMethodSchema.nullable().optional(),
  reference: z.string().nullable().optional(),
  proforma_invoice_id: z.string().uuid().nullable().optional(),
  sales_order_id: z.string().uuid().nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  allocations: z.array(PaymentAllocationInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type CustomerPaymentUpdateRequest = z.infer<typeof CustomerPaymentUpdateRequestSchema>;

export const PaymentAllocateRequestSchema = z.object({
  allocations: z.array(PaymentAllocationInputSchema),
  version: z.number().int().optional(),
});
export type PaymentAllocateRequest = z.infer<typeof PaymentAllocateRequestSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;
const NON_NEGATIVE_DECIMAL = /^(?:0+(?:\.\d+)?|[1-9]\d*(?:\.\d+)?|0*\.\d+)$/;

export const CustomerPaymentFormSchema = z.object({
  customer_id: z
    .string()
    .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a customer"),
  payment_date: z.string().min(1, "Enter a payment date"),
  currency_id: z.string(),
  amount_received: z.string().refine((value) => POSITIVE_DECIMAL.test(value.trim()), "Enter an amount greater than 0"),
  bank_charges: z
    .string()
    .refine((value) => !value.trim() || NON_NEGATIVE_DECIMAL.test(value.trim()), "Enter a valid bank charge"),
  payment_account_id: z
    .string()
    .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a cash or bank account"),
  payment_method: PaymentMethodSchema,
  reference: z.string(),
  proforma_invoice_id: z.string(),
  sales_order_id: z.string(),
  tax_id: z.string(),
  notes: z.string(),
});
export type CustomerPaymentFormValues = z.infer<typeof CustomerPaymentFormSchema>;

export type CustomerPaymentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: InvoiceDocumentStatus;
  customer_id?: string;
  proforma_invoice_id?: string;
  sales_order_id?: string;
  currency_id?: string;
  payment_method?: PaymentMethod;
  payment_date_from?: string;
  payment_date_to?: string;
};

export function customerPaymentDisplayNumber(
  payment: Pick<CustomerPayment, "document_number" | "display_number">,
): string | null {
  const display = (payment.display_number || "").trim();
  if (display) {
    return display;
  }
  const value = (payment.document_number || "").trim();
  return value ? value : null;
}

export { OpenItemTypeSchema, PaymentAllocationInputSchema, DecimalStringSchema };
