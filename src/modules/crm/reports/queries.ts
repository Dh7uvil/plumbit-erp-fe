"use client";

import { useQuery } from "@tanstack/react-query";

import { crmReportsApi } from "@/modules/crm/reports/api";
import type {
  CrmReportRangeParams,
  SalesFunnelParams,
  SalesPipelineParams,
} from "@/modules/crm/reports/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const crmReportKeys = {
  all: ["crm-reports"] as const,
  salesPipeline: (params: SalesPipelineParams) =>
    [...crmReportKeys.all, "sales-pipeline", params] as const,
  salesFunnel: (params: SalesFunnelParams) =>
    [...crmReportKeys.all, "sales-funnel", params] as const,
  winLoss: (params: CrmReportRangeParams) => [...crmReportKeys.all, "win-loss", params] as const,
  leadConversion: (params: CrmReportRangeParams) =>
    [...crmReportKeys.all, "lead-conversion", params] as const,
  salesActivity: (params: CrmReportRangeParams) =>
    [...crmReportKeys.all, "sales-activity", params] as const,
  dashboard: () => [...crmReportKeys.all, "dashboard"] as const,
};

export function useSalesPipeline(params: SalesPipelineParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(crmReportKeys.salesPipeline(params ?? {})),
    queryFn: () => crmReportsApi.salesPipeline(params ?? {}),
    enabled: params !== null,
  });
}

export function useSalesFunnel(params: SalesFunnelParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(crmReportKeys.salesFunnel(params ?? {})),
    queryFn: () => crmReportsApi.salesFunnel(params ?? {}),
    enabled: params !== null,
  });
}

export function useWinLoss(params: CrmReportRangeParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(crmReportKeys.winLoss(params ?? { from: "", to: "" })),
    queryFn: () => crmReportsApi.winLoss(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useLeadConversion(params: CrmReportRangeParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(crmReportKeys.leadConversion(params ?? { from: "", to: "" })),
    queryFn: () => crmReportsApi.leadConversion(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useSalesActivity(params: CrmReportRangeParams | null) {
  return useQuery({
    queryKey: useTenantQueryKey(crmReportKeys.salesActivity(params ?? { from: "", to: "" })),
    queryFn: () => crmReportsApi.salesActivity(params!),
    enabled: Boolean(params?.from && params.to),
  });
}

export function useCrmDashboard(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(crmReportKeys.dashboard()),
    queryFn: crmReportsApi.dashboard,
    enabled,
  });
}
