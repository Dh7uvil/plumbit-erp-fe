import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const historyPermissions = {
  product: "inventory.product.history",
  customer: "crm.customer.history",
  supplier: "purchase.supplier.history",
  cost: "inventory.cost.read",
} as const satisfies Record<string, CatalogPermission>;
