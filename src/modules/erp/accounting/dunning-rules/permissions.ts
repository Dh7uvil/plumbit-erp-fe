import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const dunningPermissions = {
  read: "accounting.dunning.read",
  manage: "accounting.dunning.manage",
  send: "accounting.dunning.send",
} as const satisfies Record<string, CatalogPermission>;
