import {
  AccountStatementSchema,
  AgingSchema,
  BalanceSheetSchema,
  CashFlowSchema,
  ExportEvidenceExceptionSchema,
  GeneralLedgerSchema,
  InvoicedNotDispatchedSchema,
  PartyStatementSchema,
  ProfitAndLossSchema,
  PurchaseSuggestionSchema,
  StockAgingSchema,
  StockMovementReportSchema,
  StockValuationGlSchema,
  StockValuationSchema,
  TaxRegisterSchema,
  TrialBalanceSchema,
  Vat201Schema,
  type AccountStatement,
  type AccountStatementParams,
  type Aging,
  type AgingParams,
  type BalanceSheet,
  type BalanceSheetParams,
  type CashFlow,
  type CashFlowParams,
  type CustomerStatementParams,
  type ExportEvidenceException,
  type ExportEvidenceExceptionParams,
  type GeneralLedger,
  type GeneralLedgerParams,
  type InventoryAsOfParams,
  type InventoryRangeParams,
  type InvoicedNotDispatched,
  type PartyStatement,
  type ProfitAndLoss,
  type ProfitAndLossParams,
  type PurchaseSuggestion,
  type PurchaseSuggestionParams,
  type StockAging,
  type StockMovementReport,
  type StockValuation,
  type StockValuationGl,
  type SupplierStatementParams,
  type TaxRegister,
  type TaxRegisterParams,
  type TrialBalance,
  type TrialBalanceParams,
  type Vat201,
} from "@/modules/erp/accounting/reports/schemas";
import { apiClient } from "@/shared/api/client";
import type { RequestParams } from "@/shared/api/client";

function inventoryParams(params: InventoryAsOfParams | InventoryRangeParams | PurchaseSuggestionParams): RequestParams {
  return {
    ...("from" in params ? { from: params.from, to: params.to } : {}),
    ...("as_of" in params ? { as_of: params.as_of } : {}),
    warehouse_id: params.warehouse_id,
    product_id: params.product_id,
    category_id: params.category_id,
  };
}

export const reportsApi = {
  trialBalance: async (params: TrialBalanceParams): Promise<TrialBalance> =>
    TrialBalanceSchema.parse(
      await apiClient.get("/reports/trial-balance", {
        params: {
          from: params.from,
          to: params.to,
          branch_id: params.branch_id,
          include_zero: params.include_zero,
        },
      }),
    ),
  generalLedger: async (params: GeneralLedgerParams): Promise<GeneralLedger> =>
    GeneralLedgerSchema.parse(
      await apiClient.get("/reports/general-ledger", {
        params: {
          account_id: params.account_id,
          from: params.from,
          to: params.to,
          party_id: params.party_id,
          branch_id: params.branch_id,
        },
      }),
    ),
  accountStatement: async (params: AccountStatementParams): Promise<AccountStatement> =>
    AccountStatementSchema.parse(
      await apiClient.get("/reports/account-statement", {
        params: {
          party_type: params.party_type,
          party_id: params.party_id,
          from: params.from,
          to: params.to,
        },
      }),
    ),
  exportEvidenceExceptions: async (
    params: ExportEvidenceExceptionParams = {},
  ): Promise<ExportEvidenceException> =>
    ExportEvidenceExceptionSchema.parse(
      await apiClient.get("/reports/export-evidence-exceptions", {
        params: { as_of: params.as_of },
      }),
    ),
  invoicedNotDispatched: async (): Promise<InvoicedNotDispatched> =>
    InvoicedNotDispatchedSchema.parse(await apiClient.get("/reports/invoiced-not-dispatched")),
  arAging: async (params: AgingParams): Promise<Aging> =>
    AgingSchema.parse(await apiClient.get("/reports/ar-aging", { params: { as_of: params.as_of } })),
  apAging: async (params: AgingParams): Promise<Aging> =>
    AgingSchema.parse(await apiClient.get("/reports/ap-aging", { params: { as_of: params.as_of } })),
  customerStatement: async (params: CustomerStatementParams): Promise<PartyStatement> =>
    PartyStatementSchema.parse(
      await apiClient.get("/reports/customer-statement", {
        params: { customer_id: params.customer_id, from: params.from, to: params.to },
      }),
    ),
  supplierStatement: async (params: SupplierStatementParams): Promise<PartyStatement> =>
    PartyStatementSchema.parse(
      await apiClient.get("/reports/supplier-statement", {
        params: { supplier_id: params.supplier_id, from: params.from, to: params.to },
      }),
    ),
  stockValuation: async (params: InventoryAsOfParams = {}): Promise<StockValuation> =>
    StockValuationSchema.parse(
      await apiClient.get("/reports/stock-valuation", { params: inventoryParams(params) }),
    ),
  stockValuationGl: async (params: InventoryAsOfParams = {}): Promise<StockValuationGl> =>
    StockValuationGlSchema.parse(
      await apiClient.get("/reports/stock-valuation-gl", { params: inventoryParams(params) }),
    ),
  stockMovement: async (params: InventoryRangeParams): Promise<StockMovementReport> =>
    StockMovementReportSchema.parse(
      await apiClient.get("/reports/stock-movement", { params: inventoryParams(params) }),
    ),
  stockAging: async (params: InventoryAsOfParams = {}): Promise<StockAging> =>
    StockAgingSchema.parse(
      await apiClient.get("/reports/stock-aging", { params: inventoryParams(params) }),
    ),
  purchaseSuggestions: async (params: PurchaseSuggestionParams = {}): Promise<PurchaseSuggestion> =>
    PurchaseSuggestionSchema.parse(
      await apiClient.get("/reports/purchase-suggestions", { params: inventoryParams(params) }),
    ),
  profitAndLoss: async (params: ProfitAndLossParams): Promise<ProfitAndLoss> =>
    ProfitAndLossSchema.parse(
      await apiClient.get("/reports/profit-and-loss", {
        params: {
          from: params.from,
          to: params.to,
          branch_id: params.branch_id,
          include_ytd: params.include_ytd,
        },
      }),
    ),
  balanceSheet: async (params: BalanceSheetParams): Promise<BalanceSheet> =>
    BalanceSheetSchema.parse(
      await apiClient.get("/reports/balance-sheet", {
        params: { as_of: params.as_of, branch_id: params.branch_id },
      }),
    ),
  cashFlow: async (params: CashFlowParams): Promise<CashFlow> =>
    CashFlowSchema.parse(
      await apiClient.get("/reports/cash-flow", {
        params: { from: params.from, to: params.to, branch_id: params.branch_id },
      }),
    ),
  salesRegister: async (params: TaxRegisterParams): Promise<TaxRegister> =>
    TaxRegisterSchema.parse(
      await apiClient.get("/reports/sales-register", {
        params: { from: params.from, to: params.to },
      }),
    ),
  purchaseRegister: async (params: TaxRegisterParams): Promise<TaxRegister> =>
    TaxRegisterSchema.parse(
      await apiClient.get("/reports/purchase-register", {
        params: { from: params.from, to: params.to },
      }),
    ),
  vat201: async (params: TaxRegisterParams): Promise<Vat201> =>
    Vat201Schema.parse(
      await apiClient.get("/reports/vat-201", {
        params: { from: params.from, to: params.to },
      }),
    ),
  downloadCsv: (path: string, params: RequestParams, filename: string): Promise<void> =>
    apiClient.downloadCsv(path, { params, filename }),
};
