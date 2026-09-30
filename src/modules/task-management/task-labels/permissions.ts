import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const taskLabelPermissions = {
  read: "tasks.label.read",
  create: "tasks.label.create",
  update: "tasks.label.update",
  delete: "tasks.label.delete",
} as const satisfies Record<string, CatalogPermission>;
