import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const periodLockPermissions = {
  read: "identity.organization.read",
  lock: "accounting.period.lock",
  override: "accounting.period.override",
} as const satisfies Record<string, CatalogPermission>;
