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
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PaymentMethodSchema,
  type PaymentMethod,
} from "@/modules/erp/customer-payments/schemas";
import {
  PaymentAllocationInputSchema,
  RelatedDocumentRefSchema,
} from "@/shared/components/document/schemas";
import { MoneySchema } from "@/shared/lib/money";

export {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
};
export type { InvoiceDocumentStatus, PaymentMethod };

export const SupplierPaymentAllocationSchema = z.object({
  item_type: z.string(),
  item_id: z.string().uuid(),
  amount: MoneySchema,
  journal_entry_id: z.string().uuid().nullable().optional().default(null),
});
export type SupplierPaymentAllocation = z.infer<typeof SupplierPaymentAllocationSchema>;

export const SupplierPaymentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string().optional(),
  status: InvoiceDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  payment_date: z.string(),
  document_date: z.string(),
  supplier_id: z.string().uuid(),
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  amount_paid: MoneySchema,
  bank_charges: MoneySchema,
  amount_unapplied: MoneySchema,
  amount_refunded: MoneySchema,
  payment_account_id: z.string().uuid(),
  payment_method: PaymentMethodSchema,
  reference: z.string().nullable(),
  purchase_order_id: z.string().uuid().nullable(),
  journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  refund_journal_entry_id: z.string().uuid().nullable(),
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
  allocations: z.array(SupplierPaymentAllocationSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SupplierPayment = z.infer<typeof SupplierPaymentSchema>;
export const SupplierPaymentListSchema = z.array(SupplierPaymentSchema);

export const SupplierPaymentCreateRequestSchema = z.object({
  supplier_id: z.string().uuid(),
  payment_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  amount_paid: MoneySchema,
  bank_charges: MoneySchema.optional(),
  payment_account_id: z.string().uuid(),
  payment_method: PaymentMethodSchema.optional(),
  reference: z.string().nullable().optional(),
  purchase_order_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  allocations: z.array(PaymentAllocationInputSchema).optional(),
});
export type SupplierPaymentCreateRequest = z.infer<typeof SupplierPaymentCreateRequestSchema>;

export const SupplierPaymentUpdateRequestSchema = z.object({
  payment_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  amount_paid: MoneySchema.nullable().optional(),
  bank_charges: MoneySchema.nullable().optional(),
  payment_account_id: z.string().uuid().nullable().optional(),
  payment_method: PaymentMethodSchema.nullable().optional(),
  reference: z.string().nullable().optional(),
  purchase_order_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  allocations: z.array(PaymentAllocationInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type SupplierPaymentUpdateRequest = z.infer<typeof SupplierPaymentUpdateRequestSchema>;

export const PaymentAllocateRequestSchema = z.object({
  allocations: z.array(PaymentAllocationInputSchema),
  version: z.number().int().optional(),
});
export type PaymentAllocateRequest = z.infer<typeof PaymentAllocateRequestSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;
const NON_NEGATIVE_DECIMAL = /^(?:0+(?:\.\d+)?|[1-9]\d*(?:\.\d+)?|0*\.\d+)$/;

export const SupplierPaymentFormSchema = z.object({
  supplier_id: z
    .string()
    .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a supplier"),
  payment_date: z.string().min(1, "Enter a payment date"),
  currency_id: z.string(),
  amount_paid: z
    .string()
    .refine((value) => POSITIVE_DECIMAL.test(value.trim()), "Enter an amount greater than 0"),
  bank_charges: z
    .string()
    .refine((value) => !value.trim() || NON_NEGATIVE_DECIMAL.test(value.trim()), "Enter a valid bank charge"),
  payment_account_id: z
    .string()
    .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a cash or bank account"),
  payment_method: PaymentMethodSchema,
  reference: z.string(),
  purchase_order_id: z.string(),
  notes: z.string(),
});
export type SupplierPaymentFormValues = z.infer<typeof SupplierPaymentFormSchema>;

export type SupplierPaymentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: InvoiceDocumentStatus;
  supplier_id?: string;
  purchase_order_id?: string;
  currency_id?: string;
  payment_method?: PaymentMethod;
  payment_date_from?: string;
  payment_date_to?: string;
};

export function supplierPaymentDisplayNumber(
  payment: Pick<SupplierPayment, "document_number" | "display_number">,
): string | null {
  const display = (payment.display_number || "").trim();
  if (display) {
    return display;
  }
  const value = (payment.document_number || "").trim();
  return value ? value : null;
}
