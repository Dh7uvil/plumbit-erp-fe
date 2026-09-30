import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const currencyPermissions = {
  read: "masters.currency.read",
  create: "masters.currency.create",
  update: "masters.currency.update",
  delete: "masters.currency.delete",
} as const satisfies Record<string, CatalogPermission>;
