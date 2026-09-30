import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const taxPermissions = {
  read: "masters.tax.read",
  create: "masters.tax.create",
  update: "masters.tax.update",
  delete: "masters.tax.delete",
} as const satisfies Record<string, CatalogPermission>;
