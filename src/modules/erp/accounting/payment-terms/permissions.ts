import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const paymentTermPermissions = {
  read: "masters.payment_term.read",
  create: "masters.payment_term.create",
  update: "masters.payment_term.update",
  delete: "masters.payment_term.delete",
} as const satisfies Record<string, CatalogPermission>;
