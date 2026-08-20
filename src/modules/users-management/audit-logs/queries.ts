"use client";

import { useQuery } from "@tanstack/react-query";

import { auditLogsApi } from "@/modules/users-management/audit-logs/api";
import type {
  AuditLogFilterParams,
  AuditLogListParams,
} from "@/modules/users-management/audit-logs/schemas";

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (params: AuditLogListParams) => [...auditLogKeys.all, "list", params] as const,
  summary: (params: AuditLogFilterParams) => [...auditLogKeys.all, "summary", params] as const,
};

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => auditLogsApi.list(params),
  });
}

export function useAuditLogSummary(params: AuditLogFilterParams) {
  return useQuery({
    queryKey: auditLogKeys.summary(params),
    queryFn: () => auditLogsApi.summary(params),
  });
}
