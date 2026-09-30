import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const openingBalancePermissions = {
  manage: "accounting.opening_balance.manage",
} as const satisfies Record<string, CatalogPermission>;
