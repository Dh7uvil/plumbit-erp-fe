import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const yearEndPermissions = {
  manage: "accounting.year_end.manage",
} as const satisfies Record<string, CatalogPermission>;
