import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const supplierPermissions = {
  read: "purchase.supplier.read",
  create: "purchase.supplier.create",
  update: "purchase.supplier.update",
  delete: "purchase.supplier.delete",
  import: "purchase.supplier.import",
  export: "purchase.supplier.export",
} as const satisfies Record<string, CatalogPermission>;
