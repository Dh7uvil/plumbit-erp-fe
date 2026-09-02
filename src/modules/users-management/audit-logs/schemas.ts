import { z } from "zod";

export const AUDIT_MODULE_IDENTITY = "identity";

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "POST",
  "CANCEL",
  "LOGIN",
  "LOGOUT",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AuditLogUserSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type AuditLogUserSummary = z.infer<typeof AuditLogUserSummarySchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string(),
  user: AuditLogUserSummarySchema.nullable().optional(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().uuid().nullable(),
  module: z.string(),
  ip_address: z.string().nullable(),
  status: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const AuditLogListSchema = z.array(AuditLogSchema);

export const AuditLogChangeSchema = z.object({
  field: z.string(),
  old_value: z.unknown().nullable().optional(),
  new_value: z.unknown().nullable().optional(),
});
export type AuditLogChange = z.infer<typeof AuditLogChangeSchema>;

export const AuditLogDetailSchema = AuditLogSchema.extend({
  user_agent: z.string().nullable().optional(),
  old_values: z.record(z.string(), z.unknown()).nullable().optional(),
  new_values: z.record(z.string(), z.unknown()).nullable().optional(),
  changes: z.array(AuditLogChangeSchema),
});
export type AuditLogDetail = z.infer<typeof AuditLogDetailSchema>;

export const AuditLogSummarySchema = z.object({
  total_events: z.number().int().nonnegative(),
  unique_users: z.number().int().nonnegative(),
  failed_attempts: z.number().int().nonnegative(),
  admin_actions: z.number().int().nonnegative(),
});
export type AuditLogSummary = z.infer<typeof AuditLogSummarySchema>;

export type AuditLogFilterParams = {
  search?: string;
  module?: string;
  action?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
};

export const AUDIT_LOG_SORT_BY = ["created_at", "action", "module"] as const;
export type AuditLogSortBy = (typeof AUDIT_LOG_SORT_BY)[number];

export function parseAuditLogSortBy(value: string | undefined): AuditLogSortBy | undefined {
  if (value === "timestamp") {
    return "created_at";
  }
  for (const field of AUDIT_LOG_SORT_BY) {
    if (field === value) {
      return field;
    }
  }
  return undefined;
}

export type AuditLogListParams = AuditLogFilterParams & {
  page?: number;
  page_size?: number;
  sort_by?: AuditLogSortBy;
  sort_order?: "asc" | "desc";
};
