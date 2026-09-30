import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const deliveryNotePermissions = {
  read: "sales.delivery_note.read",
  create: "sales.delivery_note.create",
  update: "sales.delivery_note.update",
  delete: "sales.delivery_note.delete",
  post: "sales.delivery_note.post",
} as const satisfies Record<string, CatalogPermission>;
