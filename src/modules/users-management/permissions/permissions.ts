import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const permissionCatalogPermissions = {
  read: "identity.permission.read",
} as const satisfies Record<string, CatalogPermission>;
