import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const employeePermissions = {
  read: "identity.employee.read",
  create: "identity.employee.create",
  update: "identity.employee.update",
  delete: "identity.employee.delete",
} as const satisfies Record<string, CatalogPermission>;
