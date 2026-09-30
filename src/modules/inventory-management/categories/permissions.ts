import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const categoryPermissions = {
  read: "inventory.category.read",
  create: "inventory.category.create",
  update: "inventory.category.update",
  delete: "inventory.category.delete",
} as const satisfies Record<string, CatalogPermission>;
