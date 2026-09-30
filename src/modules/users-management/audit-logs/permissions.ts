import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const auditLogPermissions = {
  read: "identity.audit_log.read",
} as const satisfies Record<string, CatalogPermission>;
