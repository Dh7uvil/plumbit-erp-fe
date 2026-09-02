import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  AuditLogDetailSchema,
  AuditLogListSchema,
  AuditLogSummarySchema,
  type AuditLog,
  type AuditLogDetail,
  type AuditLogFilterParams,
  type AuditLogListParams,
  type AuditLogSummary,
} from "@/modules/users-management/audit-logs/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

function filterQuery(params: AuditLogFilterParams) {
  return {
    search: params.search,
    module: params.module,
    action: params.action,
    user_id: params.user_id,
    date_from: params.date_from,
    date_to: params.date_to,
  };
}

export const auditLogsApi = {
  list: async (params: AuditLogListParams = {}): Promise<ListResponse<AuditLog[]>> => {
    const result = await apiClient.getList<unknown>("/audit-logs", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        ...filterQuery(params),
      },
    });
    return { data: AuditLogListSchema.parse(result.data), meta: result.meta };
  },
  summary: async (params: AuditLogFilterParams = {}): Promise<AuditLogSummary> =>
    AuditLogSummarySchema.parse(
      await apiClient.get("/audit-logs/summary", { params: filterQuery(params) }),
    ),
  byId: async (id: string): Promise<AuditLogDetail> =>
    AuditLogDetailSchema.parse(await apiClient.get(`/audit-logs/${id}`)),
};
