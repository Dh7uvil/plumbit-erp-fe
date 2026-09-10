"use client";

import { useQuery } from "@tanstack/react-query";

import { reportsApi } from "@/modules/erp/accounting/reports/api";
import type {
  AccountStatementParams,
  ExportEvidenceExceptionParams,
  GeneralLedgerParams,
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
