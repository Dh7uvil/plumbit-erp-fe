import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const costCenterPermissions = {
  read: "masters.cost_center.read",
  create: "masters.cost_center.create",
  update: "masters.cost_center.update",
  delete: "masters.cost_center.delete",
} as const satisfies Record<string, CatalogPermission>;
