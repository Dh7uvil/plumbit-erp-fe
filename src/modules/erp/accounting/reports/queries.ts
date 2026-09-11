"use client";

import { useQuery } from "@tanstack/react-query";

import { reportsApi } from "@/modules/erp/accounting/reports/api";
import type {
  AccountStatementParams,
  AgingParams,
  CustomerStatementParams,
  ExportEvidenceExceptionParams,
  GeneralLedgerParams,
  SupplierStatementParams,
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
