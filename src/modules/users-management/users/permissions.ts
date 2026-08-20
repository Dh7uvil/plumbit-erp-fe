export const userPermissions = {
  read: "identity.user.read",
  create: "identity.user.create",
  update: "identity.user.update",
  deactivate: "identity.user.delete",
  assignRoles: "identity.user.update",
} as const;
