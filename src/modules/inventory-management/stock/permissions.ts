import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const stockPermissions = {
  read: "inventory.stock.read",
  update: "inventory.stock.update",
  costRead: "inventory.cost.read",
} as const satisfies Record<string, CatalogPermission>;
