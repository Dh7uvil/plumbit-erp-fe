import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const grnChargeAdjustmentPermissions = {
  read: "inventory.grn_charge_adjustment.read",
  create: "inventory.grn_charge_adjustment.create",
  update: "inventory.grn_charge_adjustment.update",
  delete: "inventory.grn_charge_adjustment.delete",
  post: "inventory.grn_charge_adjustment.post",
} as const satisfies Record<string, CatalogPermission>;
