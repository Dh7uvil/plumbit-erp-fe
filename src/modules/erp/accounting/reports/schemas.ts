import { z } from "zod";

import { DecimalStringSchema } from "@/shared/lib/money";

export const TrialBalanceLineSchema = z.object({
  account_id: z.string().uuid(),
  account_code: z.string(),
  account_name: z.string(),
  account_type: z.string(),
  is_group: z.boolean(),
  opening_debit: DecimalStringSchema,
  opening_credit: DecimalStringSchema,
  period_debit: DecimalStringSchema,
  period_credit: DecimalStringSchema,
  closing_debit: DecimalStringSchema,
  closing_credit: DecimalStringSchema,
});
export type TrialBalanceLine = z.infer<typeof TrialBalanceLineSchema>;

export const TrialBalanceSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  is_balanced: z.boolean(),
  total_opening_debit: DecimalStringSchema,
  total_opening_credit: DecimalStringSchema,
  total_period_debit: DecimalStringSchema,
  total_period_credit: DecimalStringSchema,
  total_closing_debit: DecimalStringSchema,
  total_closing_credit: DecimalStringSchema,
  lines: z.array(TrialBalanceLineSchema).default([]),
});
export type TrialBalance = z.infer<typeof TrialBalanceSchema>;

export const GeneralLedgerLineSchema = z.object({
  journal_entry_id: z.string().uuid(),
  journal_entry_line_id: z.string().uuid(),
  document_number: z.string(),
  entry_date: z.string(),
  source_type: z.string().nullable(),
  source_id: z.string().uuid().nullable(),
  account_id: z.string().uuid(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  debit_base: DecimalStringSchema,
  credit_base: DecimalStringSchema,
  running_balance: DecimalStringSchema,
  party_id: z.string().uuid().nullable(),
  description: z.string().nullable(),
  narration: z.string().nullable(),
});
export type GeneralLedgerLine = z.infer<typeof GeneralLedgerLineSchema>;

export const GeneralLedgerSchema = z.object({
  account_id: z.string().uuid(),
  account_code: z.string(),
  account_name: z.string(),
  from_date: z.string(),
  to_date: z.string(),
  opening_balance: DecimalStringSchema,
  closing_balance: DecimalStringSchema,
  lines: z.array(GeneralLedgerLineSchema).default([]),
});
export type GeneralLedger = z.infer<typeof GeneralLedgerSchema>;

export const AccountStatementLineSchema = z.object({
  journal_entry_id: z.string().uuid(),
  document_number: z.string(),
  entry_date: z.string(),
  due_date: z.string().nullable(),
  external_reference: z.string().nullable(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  running_balance: DecimalStringSchema,
  description: z.string().nullable(),
});
export type AccountStatementLine = z.infer<typeof AccountStatementLineSchema>;

export const AccountStatementSchema = z.object({
  party_type: z.string(),
  party_id: z.string().uuid(),
  from_date: z.string(),
  to_date: z.string(),
  opening_balance: DecimalStringSchema,
  closing_balance: DecimalStringSchema,
  lines: z.array(AccountStatementLineSchema).default([]),
});
export type AccountStatement = z.infer<typeof AccountStatementSchema>;

export type TrialBalanceParams = {
  from: string;
  to: string;
  branch_id?: string;
  include_zero?: boolean;
};

export type GeneralLedgerParams = {
  account_id: string;
  from: string;
  to: string;
  party_id?: string;
  branch_id?: string;
};

export type AccountStatementParams = {
  party_type: "CUSTOMER" | "SUPPLIER";
  party_id: string;
  from: string;
  to: string;
};

export const ExportEvidenceExceptionLineSchema = z.object({
  sales_invoice_id: z.string().uuid(),
  document_number: z.string(),
  invoice_date: z.string(),
  customer_id: z.string().uuid(),
  customer_name: z.string(),
  grand_total: DecimalStringSchema,
  days_elapsed: z.number().int(),
  window_days: z.number().int(),
  overdue: z.boolean(),
});
export type ExportEvidenceExceptionLine = z.infer<typeof ExportEvidenceExceptionLineSchema>;

export const ExportEvidenceExceptionSchema = z.object({
  as_of: z.string(),
  window_days: z.number().int(),
  lines: z.array(ExportEvidenceExceptionLineSchema).default([]),
});
export type ExportEvidenceException = z.infer<typeof ExportEvidenceExceptionSchema>;

export const InvoicedNotDispatchedLineSchema = z.object({
  sales_invoice_id: z.string().uuid(),
  sales_invoice_line_id: z.string().uuid(),
  document_number: z.string(),
  invoice_date: z.string(),
  customer_id: z.string().uuid(),
  customer_name: z.string(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  amount: DecimalStringSchema,
  cogs_status: z.string(),
});
export type InvoicedNotDispatchedLine = z.infer<typeof InvoicedNotDispatchedLineSchema>;

export const InvoicedNotDispatchedSchema = z.object({
  lines: z.array(InvoicedNotDispatchedLineSchema).default([]),
});
export type InvoicedNotDispatched = z.infer<typeof InvoicedNotDispatchedSchema>;

export type ExportEvidenceExceptionParams = {
  as_of?: string;
};

const SOURCE_HREFS: Record<string, (id: string) => string> = {
  journal_entry: (id) => `/journals/${id}`,
  quotation: (id) => `/quotations/${id}`,
  sales_order: (id) => `/sales-orders/${id}`,
  purchase_order: (id) => `/purchase-orders/${id}`,
  goods_receipt: (id) => `/goods-receipts/${id}`,
  delivery_note: (id) => `/delivery-notes/${id}`,
  package: (id) => `/packages/${id}`,
  shipment: (id) => `/shipments/${id}`,
  sales_return: (id) => `/sales-returns/${id}`,
  sales_invoice: (id) => `/sales-invoices/${id}`,
  purchase_invoice: (id) => `/purchase-invoices/${id}`,
  credit_note: (id) => `/credit-notes/${id}`,
  debit_note: (id) => `/debit-notes/${id}`,
  stock_transfer: (id) => `/stock-transfers/${id}`,
  stock_adjustment: (id) => `/stock-adjustments/${id}`,
  opening_balance: (id) => `/journals/${id}`,
};

export function sourceDocumentHref(
  sourceType: string | null | undefined,
  sourceId: string | null | undefined,
  journalEntryId: string,
): string {
  if (sourceType && sourceId && SOURCE_HREFS[sourceType]) {
    return SOURCE_HREFS[sourceType](sourceId);
  }
  return `/journals/${journalEntryId}`;
}
