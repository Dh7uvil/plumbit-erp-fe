import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const warehousePermissions = {
  read: "inventory.warehouse.read",
  create: "inventory.warehouse.create",
  update: "inventory.warehouse.update",
  delete: "inventory.warehouse.delete",
} as const satisfies Record<string, CatalogPermission>;
