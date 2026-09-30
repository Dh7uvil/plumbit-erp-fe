import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const branchPermissions = {
  read: "identity.branch.read",
  create: "identity.branch.create",
  update: "identity.branch.update",
  delete: "identity.branch.delete",
} as const satisfies Record<string, CatalogPermission>;
