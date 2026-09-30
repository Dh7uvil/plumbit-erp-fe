import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const organizationSettingsPermissions = {
  read: "identity.organization.read",
  update: "identity.organization.update",
} as const satisfies Record<string, CatalogPermission>;
