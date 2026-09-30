import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const accountPermissions = {
  read: "accounting.account.read",
  create: "accounting.account.create",
  update: "accounting.account.update",
  delete: "accounting.account.delete",
} as const satisfies Record<string, CatalogPermission>;
