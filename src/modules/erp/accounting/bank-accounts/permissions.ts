import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const bankAccountPermissions = {
  read: "accounting.bank_account.read",
  create: "accounting.bank_account.create",
  update: "accounting.bank_account.update",
  delete: "accounting.bank_account.delete",
} as const satisfies Record<string, CatalogPermission>;
