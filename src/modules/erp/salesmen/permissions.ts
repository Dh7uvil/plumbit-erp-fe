import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const salesmanPermissions = {
  read: "sales.salesman.read",
  update: "sales.salesman.update",
} as const satisfies Record<string, CatalogPermission>;
