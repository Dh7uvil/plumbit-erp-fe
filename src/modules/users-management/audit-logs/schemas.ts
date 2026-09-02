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

export type AuditLogListParams = AuditLogFilterParams & {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};
