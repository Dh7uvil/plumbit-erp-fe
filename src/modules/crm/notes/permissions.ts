import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const notePermissions = {
  read: "crm.note.read",
  create: "crm.note.create",
  update: "crm.note.update",
  delete: "crm.note.delete",
} as const satisfies Record<string, CatalogPermission>;
