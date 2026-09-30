import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const attachmentPermissions = {
  read: "identity.attachment.read",
  create: "identity.attachment.create",
  update: "identity.attachment.update",
  delete: "identity.attachment.delete",
} as const satisfies Record<string, CatalogPermission>;
