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

export const AgingBucketTotalsSchema = z.object({
  current: DecimalStringSchema.default("0"),
  days_1_30: DecimalStringSchema.default("0"),
  days_31_60: DecimalStringSchema.default("0"),
  days_61_90: DecimalStringSchema.default("0"),
  days_91_plus: DecimalStringSchema.default("0"),
  unapplied_credits: DecimalStringSchema.default("0"),
  total: DecimalStringSchema.default("0"),
});
export type AgingBucketTotals = z.infer<typeof AgingBucketTotalsSchema>;

export const AgingPartyRowSchema = AgingBucketTotalsSchema.extend({
  party_id: z.string().uuid(),
  party_name: z.string(),
  currency_id: z.string().uuid().nullable().optional().default(null),
});
export type AgingPartyRow = z.infer<typeof AgingPartyRowSchema>;

export const AgingSchema = z.object({
  as_of: z.string(),
  rows: z.array(AgingPartyRowSchema).default([]),
  totals: AgingBucketTotalsSchema,
});
export type Aging = z.infer<typeof AgingSchema>;

export type AgingParams = {
  as_of: string;
};

export const PartyStatementLineSchema = z.object({
  document_type: z.string(),
  document_id: z.string().uuid(),
  document_number: z.string(),
  document_date: z.string(),
  due_date: z.string().nullable().optional().default(null),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  running_balance: DecimalStringSchema,
  description: z.string().nullable().optional().default(null),
});
export type PartyStatementLine = z.infer<typeof PartyStatementLineSchema>;

export const PartyStatementSchema = z.object({
  party_type: z.string(),
  party_id: z.string().uuid(),
  party_name: z.string(),
  from_date: z.string(),
  to_date: z.string(),
  opening_balance: DecimalStringSchema,
  closing_balance: DecimalStringSchema,
  lines: z.array(PartyStatementLineSchema).default([]),
});
export type PartyStatement = z.infer<typeof PartyStatementSchema>;

export type CustomerStatementParams = {
  customer_id: string;
  from: string;
  to: string;
};

export type SupplierStatementParams = {
  supplier_id: string;
  from: string;
  to: string;
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
  customer_payment: (id) => `/customer-payments/${id}`,
  supplier_payment: (id) => `/supplier-payments/${id}`,
  landed_cost: (id) => `/landed-costs/${id}`,
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

export const StockValuationLineSchema = z.object({
  warehouse_id: z.string().uuid(),
  warehouse_code: z.string(),
  warehouse_name: z.string(),
  product_id: z.string().uuid(),
  sku: z.string(),
  product_name: z.string(),
  category_id: z.string().uuid().nullable().optional().default(null),
  qty_remaining: DecimalStringSchema,
  landed_unit_cost: DecimalStringSchema,
  stock_value: DecimalStringSchema,
  document_date: z.string(),
  layer_id: z.string().uuid(),
});
export type StockValuationLine = z.infer<typeof StockValuationLineSchema>;

export const StockValuationSchema = z.object({
  as_of: z.string(),
  total_qty: DecimalStringSchema,
  total_value: DecimalStringSchema,
  lines: z.array(StockValuationLineSchema).optional().default([]),
});
export type StockValuation = z.infer<typeof StockValuationSchema>;

export const StockValuationGlSchema = z.object({
  as_of: z.string(),
  inventory_account_id: z.string().uuid().nullable().optional().default(null),
  valuation_total: DecimalStringSchema,
  gl_balance: DecimalStringSchema,
  difference: DecimalStringSchema,
});
export type StockValuationGl = z.infer<typeof StockValuationGlSchema>;

export const StockMovementReportLineSchema = z.object({
  warehouse_id: z.string().uuid(),
  warehouse_code: z.string(),
  warehouse_name: z.string(),
  product_id: z.string().uuid(),
  sku: z.string(),
  product_name: z.string(),
  opening_qty: DecimalStringSchema,
  opening_value: DecimalStringSchema,
  qty_in: DecimalStringSchema,
  value_in: DecimalStringSchema,
  qty_out: DecimalStringSchema,
  value_out: DecimalStringSchema,
  closing_qty: DecimalStringSchema,
  closing_value: DecimalStringSchema,
});
export type StockMovementReportLine = z.infer<typeof StockMovementReportLineSchema>;

export const StockMovementReportSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  lines: z.array(StockMovementReportLineSchema).optional().default([]),
  total_opening_qty: DecimalStringSchema,
  total_opening_value: DecimalStringSchema,
  total_closing_qty: DecimalStringSchema,
  total_closing_value: DecimalStringSchema,
});
export type StockMovementReport = z.infer<typeof StockMovementReportSchema>;

export const StockAgingBucketTotalsSchema = z.object({
  days_0_30: DecimalStringSchema.optional().default("0"),
  days_31_60: DecimalStringSchema.optional().default("0"),
  days_61_90: DecimalStringSchema.optional().default("0"),
  days_91_plus: DecimalStringSchema.optional().default("0"),
  total: DecimalStringSchema.optional().default("0"),
});
export type StockAgingBucketTotals = z.infer<typeof StockAgingBucketTotalsSchema>;

export const StockAgingLineSchema = z.object({
  warehouse_id: z.string().uuid(),
  warehouse_code: z.string(),
  warehouse_name: z.string(),
  product_id: z.string().uuid(),
  sku: z.string(),
  product_name: z.string(),
  layer_id: z.string().uuid(),
  document_date: z.string(),
  days: z.number().int(),
  bucket: z.string(),
  qty_remaining: DecimalStringSchema,
  stock_value: DecimalStringSchema,
});
export type StockAgingLine = z.infer<typeof StockAgingLineSchema>;

export const StockAgingSchema = z.object({
  as_of: z.string(),
  lines: z.array(StockAgingLineSchema).optional().default([]),
  totals: StockAgingBucketTotalsSchema,
});
export type StockAging = z.infer<typeof StockAgingSchema>;

export const PurchaseSuggestionLineSchema = z.object({
  warehouse_id: z.string().uuid(),
  warehouse_code: z.string(),
  warehouse_name: z.string(),
  product_id: z.string().uuid(),
  sku: z.string(),
  product_name: z.string(),
  qty_on_hand: DecimalStringSchema,
  qty_available: DecimalStringSchema,
  suggested_qty: DecimalStringSchema,
  reorder_level: z.string().nullable().optional().default(null),
  reorder_qty: z.string().nullable().optional().default(null),
  preferred_supplier_id: z.string().uuid().nullable().optional().default(null),
  preferred_supplier_name: z.string().nullable().optional().default(null),
});
export type PurchaseSuggestionLine = z.infer<typeof PurchaseSuggestionLineSchema>;

export const PurchaseSuggestionSchema = z.object({
  as_of: z.string(),
  lines: z.array(PurchaseSuggestionLineSchema).optional().default([]),
});
export type PurchaseSuggestion = z.infer<typeof PurchaseSuggestionSchema>;

export const ProfitAndLossLineSchema = z.object({
  account_id: z.string().uuid(),
  account_code: z.string(),
  account_name: z.string(),
  account_type: z.string(),
  account_subtype: z.string(),
  amount: DecimalStringSchema,
  comparative_amount: z.string().nullable().optional().default(null),
  ytd_amount: z.string().nullable().optional().default(null),
});
export type ProfitAndLossLine = z.infer<typeof ProfitAndLossLineSchema>;

export const ProfitAndLossSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  comparative_from: z.string().nullable().optional().default(null),
  comparative_to: z.string().nullable().optional().default(null),
  ytd_from: z.string().nullable().optional().default(null),
  total_income: DecimalStringSchema,
  total_expense: DecimalStringSchema,
  net_profit: DecimalStringSchema,
  comparative_net_profit: z.string().nullable().optional().default(null),
  ytd_net_profit: z.string().nullable().optional().default(null),
  lines: z.array(ProfitAndLossLineSchema).optional().default([]),
});
export type ProfitAndLoss = z.infer<typeof ProfitAndLossSchema>;

export const BalanceSheetLineSchema = z.object({
  account_id: z.string().uuid().nullable().optional().default(null),
  account_code: z.string(),
  account_name: z.string(),
  account_type: z.string(),
  account_subtype: z.string(),
  amount: DecimalStringSchema,
  comparative_amount: z.string().nullable().optional().default(null),
});
export type BalanceSheetLine = z.infer<typeof BalanceSheetLineSchema>;

export const BalanceSheetSchema = z.object({
  as_of: z.string(),
  comparative_as_of: z.string().nullable().optional().default(null),
  total_assets: DecimalStringSchema,
  total_liabilities: DecimalStringSchema,
  total_equity: DecimalStringSchema,
  current_earnings: DecimalStringSchema,
  comparative_total_assets: z.string().nullable().optional().default(null),
  comparative_total_liabilities: z.string().nullable().optional().default(null),
  comparative_total_equity: z.string().nullable().optional().default(null),
  is_balanced: z.boolean(),
  lines: z.array(BalanceSheetLineSchema).optional().default([]),
});
export type BalanceSheet = z.infer<typeof BalanceSheetSchema>;

export const CashFlowLineSchema = z.object({
  key: z.string(),
  label: z.string(),
  amount: DecimalStringSchema,
  comparative_amount: z.string().nullable().optional().default(null),
  account_id: z.string().uuid().nullable().optional().default(null),
});
export type CashFlowLine = z.infer<typeof CashFlowLineSchema>;

export const CashFlowSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  comparative_from: z.string().nullable().optional().default(null),
  comparative_to: z.string().nullable().optional().default(null),
  net_profit: DecimalStringSchema,
  cash_opening: DecimalStringSchema,
  cash_closing: DecimalStringSchema,
  net_change: DecimalStringSchema,
  comparative_net_change: z.string().nullable().optional().default(null),
  lines: z.array(CashFlowLineSchema).optional().default([]),
});
export type CashFlow = z.infer<typeof CashFlowSchema>;

export const TaxRegisterLineSchema = z.object({
  document_type: z.string(),
  document_id: z.string().uuid(),
  document_number: z.string(),
  document_date: z.string(),
  party_id: z.string().uuid(),
  party_name: z.string(),
  party_trn: z.string().nullable().optional().default(null),
  tax_treatment: z.string(),
  tax_category: z.string().nullable().optional().default(null),
  place_of_supply: z.string(),
  net_amount: DecimalStringSchema,
  tax_amount: DecimalStringSchema,
  grand_total: DecimalStringSchema,
  is_export: z.boolean().optional().default(false),
  is_reverse_charge: z.boolean().optional().default(false),
  is_designated_zone: z.boolean().optional().default(false),
});
export type TaxRegisterLine = z.infer<typeof TaxRegisterLineSchema>;

export const TaxRegisterSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  total_net: DecimalStringSchema,
  total_tax: DecimalStringSchema,
  total_grand: DecimalStringSchema,
  lines: z.array(TaxRegisterLineSchema).optional().default([]),
});
export type TaxRegister = z.infer<typeof TaxRegisterSchema>;

export const Vat201BoxSchema = z.object({
  code: z.string(),
  label: z.string(),
  net_amount: DecimalStringSchema,
  tax_amount: DecimalStringSchema,
});
export type Vat201Box = z.infer<typeof Vat201BoxSchema>;

export const Vat201Schema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  recoverable_input_vat: DecimalStringSchema,
  net_vat: DecimalStringSchema,
  export_evidence_exceptions: z.number().int(),
  boxes: z.array(Vat201BoxSchema).optional().default([]),
});
export type Vat201 = z.infer<typeof Vat201Schema>;

export type InventoryAsOfParams = {
  as_of?: string;
  warehouse_id?: string;
  product_id?: string;
  category_id?: string;
};

export type InventoryRangeParams = {
  from: string;
  to: string;
  warehouse_id?: string;
  product_id?: string;
  category_id?: string;
};

export type PurchaseSuggestionParams = {
  warehouse_id?: string;
  product_id?: string;
  category_id?: string;
};

export type ProfitAndLossParams = {
  from: string;
  to: string;
  branch_id?: string;
  include_ytd?: boolean;
};

export type BalanceSheetParams = {
  as_of: string;
  branch_id?: string;
};

export type CashFlowParams = {
  from: string;
  to: string;
  branch_id?: string;
};

export type TaxRegisterParams = {
  from: string;
  to: string;
};

export const ThreeWayMatchLineSchema = z.object({
  purchase_order_id: z.string().uuid(),
  purchase_order_line_id: z.string().uuid(),
  document_number: z.string(),
  order_date: z.string(),
  supplier_id: z.string().uuid(),
  supplier_name: z.string(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  ordered_qty: DecimalStringSchema,
  received_qty: DecimalStringSchema,
  billed_qty: DecimalStringSchema,
  ordered_value: DecimalStringSchema,
  received_value: DecimalStringSchema,
  billed_value: DecimalStringSchema,
  status: z.string(),
});
export type ThreeWayMatchLine = z.infer<typeof ThreeWayMatchLineSchema>;

export const ThreeWayMatchSchema = z.object({
  lines: z.array(ThreeWayMatchLineSchema).optional().default([]),
});
export type ThreeWayMatch = z.infer<typeof ThreeWayMatchSchema>;

export const ReceivedNotBilledLineSchema = z.object({
  goods_receipt_id: z.string().uuid(),
  goods_receipt_line_id: z.string().uuid(),
  document_number: z.string(),
  document_date: z.string(),
  supplier_id: z.string().uuid(),
  supplier_name: z.string(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  qty_billed: DecimalStringSchema,
  outstanding_qty: DecimalStringSchema,
  amount: DecimalStringSchema,
});
export type ReceivedNotBilledLine = z.infer<typeof ReceivedNotBilledLineSchema>;

export const ReceivedNotBilledSchema = z.object({
  lines: z.array(ReceivedNotBilledLineSchema).optional().default([]),
});
export type ReceivedNotBilled = z.infer<typeof ReceivedNotBilledSchema>;

export const DashboardUnpostedCountSchema = z.object({
  document_type: z.string(),
  count: z.number().int(),
});
export type DashboardUnpostedCount = z.infer<typeof DashboardUnpostedCountSchema>;

export const DashboardCreditBreachSchema = z.object({
  customer_id: z.string().uuid(),
  customer_name: z.string(),
  credit_limit: DecimalStringSchema,
  outstanding: DecimalStringSchema,
});
export type DashboardCreditBreach = z.infer<typeof DashboardCreditBreachSchema>;

export const DashboardSchema = z.object({
  as_of: z.string(),
  open_ar: DecimalStringSchema,
  open_ap: DecimalStringSchema,
  overdue_ar_count: z.number().int(),
  overdue_ap_count: z.number().int(),
  stock_valuation: DecimalStringSchema,
  unposted: z.array(DashboardUnpostedCountSchema).optional().default([]),
  deliveries_today: z.number().int(),
  receipts_today: z.number().int(),
  credit_limit_breaches: z.array(DashboardCreditBreachSchema).optional().default([]),
});
export type Dashboard = z.infer<typeof DashboardSchema>;

export function glHref(accountId: string, from: string, to: string, branchId?: string): string {
  const params = new URLSearchParams({ account_id: accountId, from, to });
  if (branchId) {
    params.set("branch_id", branchId);
  }
  return `/reports/general-ledger?${params.toString()}`;
}

export function vat201BoxRegisterHref(box: Vat201Box, from: string, to: string): string {
  const haystack = `${box.code} ${box.label}`.toLowerCase();
  const isPurchase = /input|purchase|recoverable|import/.test(haystack);
  const path = isPurchase ? "/reports/purchase-register" : "/reports/sales-register";
  const params = new URLSearchParams({ from, to, box: box.code });
  return `${path}?${params.toString()}`;
}

export function taxRegisterLineMatchesBox(line: TaxRegisterLine, boxCode: string): boolean {
  const code = boxCode.toLowerCase();
  if (/export|zero/.test(code)) {
    return line.is_export || line.tax_category === "ZERO_RATED";
  }
  if (/exempt/.test(code)) {
    return line.tax_category === "EXEMPT";
  }
  if (/designated|out.of.scope|out_of_scope/.test(code)) {
    return line.is_designated_zone || line.tax_category === "OUT_OF_SCOPE";
  }
  if (/reverse|rcm/.test(code)) {
    return line.is_reverse_charge;
  }
  if (/standard/.test(code)) {
    return line.tax_category === "STANDARD" || (!line.is_export && !line.is_reverse_charge);
  }
  return true;
}

