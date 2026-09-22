import { z } from "zod";

import { PaymentAllocationInputSchema } from "@/shared/components/document/schemas";

export const ChequeAllocationSchema = z.object({
  id: z.string().uuid(),
  item_type: z.string(),
  item_id: z.string().uuid(),
  item_document_number: z.string().nullable().optional(),
  amount: z.string(),
  journal_entry_id: z.string().uuid().nullable(),
  reversed_at: z.string().nullable(),
  created_at: z.string().nullable().optional(),
});

export const ChequeSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  cheque_number: z.string(),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  status: z.enum(["DRAFT", "ISSUED", "DEPOSITED", "CLEARED", "BOUNCED", "CANCELLED"]),
  version: z.number(),
  is_posted: z.boolean(),
  cheque_date: z.string(),
  due_date: z.string().nullable(),
  amount: z.string(),
  amount_unapplied: z.string(),
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: z.string(),
  foreign_amount: z.string(),
  base_amount: z.string(),
  party_type: z.enum(["CUSTOMER", "SUPPLIER"]).nullable(),
  party_id: z.string().uuid().nullable(),
  bank_account_id: z.string().uuid(),
  customer_payment_id: z.string().uuid().nullable(),
  supplier_payment_id: z.string().uuid().nullable(),
  voucher_id: z.string().uuid().nullable(),
  narration: z.string().nullable(),
  journal_entry_id: z.string().uuid().nullable(),
  clearing_journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  clearing_reversal_journal_entry_id: z.string().uuid().nullable().optional(),
  allocations: z.array(ChequeAllocationSchema).default([]),
  bounce_reason: z.string().nullable().optional(),
  available_actions: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ChequeCreateRequestSchema = z.object({
  cheque_number: z.string().min(1),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  cheque_date: z.string(),
  due_date: z.string().nullable().optional(),
  amount: z.string(),
  currency_id: z.string().uuid().optional(),
  party_type: z.enum(["CUSTOMER", "SUPPLIER"]).nullable().optional(),
  party_id: z.string().uuid().nullable().optional(),
  bank_account_id: z.string().uuid(),
  narration: z.string().nullable().optional(),
  allocations: z.array(PaymentAllocationInputSchema).optional(),
});

export const ChequeUpdateRequestSchema = ChequeCreateRequestSchema.partial().extend({
  version: z.number(),
});

export type Cheque = z.infer<typeof ChequeSchema>;
export type ChequeCreateRequest = z.infer<typeof ChequeCreateRequestSchema>;
export type ChequeUpdateRequest = z.infer<typeof ChequeUpdateRequestSchema>;

export type ChequeListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: string;
  direction?: string;
  bank_account_id?: string;
  due_date_from?: string;
  due_date_to?: string;
};
