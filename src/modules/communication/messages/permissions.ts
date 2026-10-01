import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const messagePermissions = {
  read: "communication.message.read",
  create: "communication.message.create",
  update: "communication.message.update",
  delete: "communication.message.delete",
} as const satisfies Record<string, CatalogPermission>;
