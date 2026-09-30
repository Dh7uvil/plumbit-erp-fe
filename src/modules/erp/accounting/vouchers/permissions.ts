import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const voucherPermissions = {
  read: "accounting.voucher.read",
  create: "accounting.voucher.create",
  update: "accounting.voucher.update",
  delete: "accounting.voucher.delete",
  post: "accounting.voucher.post",
  cancel: "accounting.voucher.cancel",
} as const satisfies Record<string, CatalogPermission>;
