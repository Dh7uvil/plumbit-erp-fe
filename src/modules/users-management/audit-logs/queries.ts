"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { auditLogsApi } from "@/modules/users-management/audit-logs/api";
import type {
  AuditLogFilterParams,
  AuditLogListParams,
} from "@/modules/users-management/audit-logs/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (params: AuditLogListParams) => [...auditLogKeys.all, "list", params] as const,
  summary: (params: AuditLogFilterParams) => [...auditLogKeys.all, "summary", params] as const,
  detail: (id: string) => [...auditLogKeys.all, "detail", id] as const,
};

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(auditLogKeys.list(params)),
    queryFn: () => auditLogsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditLogSummary(params: AuditLogFilterParams) {
  return useQuery({
    queryKey: useTenantQueryKey(auditLogKeys.summary(params)),
    queryFn: () => auditLogsApi.summary(params),
  });
}

export function useAuditLog(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(auditLogKeys.detail(id ?? "")),
    queryFn: () => auditLogsApi.byId(id!),
    enabled: Boolean(id),
  });
}
