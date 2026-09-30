import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const unitPermissions = {
  read: "inventory.unit.read",
  create: "inventory.unit.create",
  update: "inventory.unit.update",
  delete: "inventory.unit.delete",
} as const satisfies Record<string, CatalogPermission>;
