import type { Role } from "@/modules/users-management/roles/schemas";

export const rolePermissions = {
  read: "identity.role.read",
  create: "identity.role.create",
  update: "identity.role.update",
  delete: "identity.role.delete",
  assignPermissions: "identity.role.update",
} as const;

export function isResettableSystemRole(role: Pick<Role, "name" | "is_system_role"> | undefined) {
  return role?.is_system_role === true && role.name.toLowerCase() === "superadmin";
}
