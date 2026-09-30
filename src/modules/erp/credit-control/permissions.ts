import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const creditControlPermissions = {
  override: "accounting.credit_control.override",
} as const satisfies Record<string, CatalogPermission>;
