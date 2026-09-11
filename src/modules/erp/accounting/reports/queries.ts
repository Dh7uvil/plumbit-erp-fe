"use client";

import { useQuery } from "@tanstack/react-query";

import { reportsApi } from "@/modules/erp/accounting/reports/api";
import type {
  AccountStatementParams,
  AgingParams,
  BalanceSheetParams,
  CashFlowParams,
  CustomerStatementParams,
  ExportEvidenceExceptionParams,
  GeneralLedgerParams,
  InventoryAsOfParams,
  InventoryRangeParams,
  ProfitAndLossParams,
  PurchaseSuggestionParams,
  SupplierStatementParams,
  TaxRegisterParams,
  TrialBalanceParams,
} from "@/modules/erp/accounting/reports/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const reportKeys = {
  all: ["reports"] as const,
  trialBalance: (params: TrialBalanceParams) =>
    [...reportKeys.all, "trial-balance", params] as const,
  generalLedger: (params: GeneralLedgerParams) =>
    [...reportKeys.all, "general-ledger", params] as const,
  accountStatement: (params: AccountStatementParams) =>
    [...reportKeys.all, "account-statement", params] as const,
  exportEvidenceExceptions: (params: ExportEvidenceExceptionParams) =>
    [...reportKeys.all, "export-evidence-exceptions", params] as const,
  invoicedNotDispatched: () => [...reportKeys.all, "invoiced-not-dispatched"] as const,
  arAging: (params: AgingParams) => [...reportKeys.all, "ar-aging", params] as const,
  apAging: (params: AgingParams) => [...reportKeys.all, "ap-aging", params] as const,
  customerStatement: (params: CustomerStatementParams) =>
    [...reportKeys.all, "customer-statement", params] as const,
  supplierStatement: (params: SupplierStatementParams) =>
    [...reportKeys.all, "supplier-statement", params] as const,
  stockValuation: (params: InventoryAsOfParams) =>
    [...reportKeys.all, "stock-valuation", params] as const,
  stockValuationGl: (params: InventoryAsOfParams) =>
    [...reportKeys.all, "stock-valuation-gl", params] as const,
  stockMovement: (params: InventoryRangeParams) =>
    [...reportKeys.all, "stock-movement", params] as const,
  stockAging: (params: InventoryAsOfParams) => [...reportKeys.all, "stock-aging", params] as const,
  purchaseSuggestions: (params: PurchaseSuggestionParams) =>
    [...reportKeys.all, "purchase-suggestions", params] as const,
  profitAndLoss: (params: ProfitAndLossParams) =>
    [...reportKeys.all, "profit-and-loss", params] as const,
  balanceSheet: (params: BalanceSheetParams) =>
    [...reportKeys.all, "balance-sheet", params] as const,
  cashFlow: (params: CashFlowParams) => [...reportKeys.all, "cash-flow", params] as const,
  salesRegister: (params: TaxRegisterParams) =>
    [...reportKeys.all, "sales-register", params] as const,
  purchaseRegister: (params: TaxRegisterParams) =>
    [...reportKeys.all, "purchase-register", params] as const,
  vat201: (params: TaxRegisterParams) => [...reportKeys.all, "vat-201", params] as const,
  threeWayMatch: () => [...reportKeys.all, "three-way-match"] as const,
  receivedNotBilled: () => [...reportKeys.all, "received-not-billed"] as const,
  dashboard: () => [...reportKeys.all, "dashboard"] as const,
};

export function useTrialBalance(params: TrialBalanceParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.trialBalance(params ?? { from: "", to: "" })),
    queryFn: () => reportsApi.trialBalance(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useGeneralLedger(params: GeneralLedgerParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(
      reportKeys.generalLedger(params ?? { account_id: "", from: "", to: "" }),
    ),
    queryFn: () => reportsApi.generalLedger(params!),
    enabled: Boolean(params?.account_id && params.from && params.to),
  });
}

export function useAccountStatement(params: AccountStatementParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(
      reportKeys.accountStatement(
        params ?? { party_type: "CUSTOMER", party_id: "", from: "", to: "" },
      ),
    ),
    queryFn: () => reportsApi.accountStatement(params!),
    enabled: Boolean(params?.party_id && params.from && params.to),
  });
}

export function useExportEvidenceExceptions(params: ExportEvidenceExceptionParams = {}, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.exportEvidenceExceptions(params)),
    queryFn: () => reportsApi.exportEvidenceExceptions(params),
    enabled,
  });
}

export function useInvoicedNotDispatched(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.invoicedNotDispatched()),
    queryFn: reportsApi.invoicedNotDispatched,
    enabled,
  });
}

export function useArAging(params: AgingParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.arAging(params ?? { as_of: "" })),
    queryFn: () => reportsApi.arAging(params!),
    enabled: Boolean(params?.as_of),
  });
}

export function useApAging(params: AgingParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.apAging(params ?? { as_of: "" })),
    queryFn: () => reportsApi.apAging(params!),
    enabled: Boolean(params?.as_of),
  });
}

export function useCustomerStatement(params: CustomerStatementParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(
      reportKeys.customerStatement(params ?? { customer_id: "", from: "", to: "" }),
    ),
    queryFn: () => reportsApi.customerStatement(params!),
    enabled: Boolean(params?.customer_id && params.from && params.to),
  });
}

export function useSupplierStatement(params: SupplierStatementParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(
      reportKeys.supplierStatement(params ?? { supplier_id: "", from: "", to: "" }),
    ),
    queryFn: () => reportsApi.supplierStatement(params!),
    enabled: Boolean(params?.supplier_id && params.from && params.to),
  });
}

export function useStockValuation(params: InventoryAsOfParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.stockValuation(params ?? {})),
    queryFn: () => reportsApi.stockValuation(params ?? {}),
    enabled: Boolean(params),
  });
}

export function useStockValuationGl(params: InventoryAsOfParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.stockValuationGl(params ?? {})),
    queryFn: () => reportsApi.stockValuationGl(params ?? {}),
    enabled: Boolean(params),
  });
}

export function useStockMovementReport(params: InventoryRangeParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(
      reportKeys.stockMovement(params ?? { from: "", to: "" }),
    ),
    queryFn: () => reportsApi.stockMovement(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useStockAging(params: InventoryAsOfParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.stockAging(params ?? {})),
    queryFn: () => reportsApi.stockAging(params ?? {}),
    enabled: Boolean(params),
  });
}

export function usePurchaseSuggestions(params: PurchaseSuggestionParams = {}) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.purchaseSuggestions(params)),
    queryFn: () => reportsApi.purchaseSuggestions(params),
  });
}

export function useProfitAndLoss(params: ProfitAndLossParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.profitAndLoss(params ?? { from: "", to: "" })),
    queryFn: () => reportsApi.profitAndLoss(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useBalanceSheet(params: BalanceSheetParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.balanceSheet(params ?? { as_of: "" })),
    queryFn: () => reportsApi.balanceSheet(params!),
    enabled: Boolean(params?.as_of),
  });
}

export function useCashFlow(params: CashFlowParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.cashFlow(params ?? { from: "", to: "" })),
    queryFn: () => reportsApi.cashFlow(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useSalesRegister(params: TaxRegisterParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.salesRegister(params ?? { from: "", to: "" })),
    queryFn: () => reportsApi.salesRegister(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function usePurchaseRegister(params: TaxRegisterParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.purchaseRegister(params ?? { from: "", to: "" })),
    queryFn: () => reportsApi.purchaseRegister(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useVat201(params: TaxRegisterParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.vat201(params ?? { from: "", to: "" })),
    queryFn: () => reportsApi.vat201(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useThreeWayMatch(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.threeWayMatch()),
    queryFn: reportsApi.threeWayMatch,
    enabled,
  });
}

export function useReceivedNotBilled(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.receivedNotBilled()),
    queryFn: reportsApi.receivedNotBilled,
    enabled,
  });
}

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(reportKeys.dashboard()),
    queryFn: reportsApi.dashboard,
    enabled,
  });
}

