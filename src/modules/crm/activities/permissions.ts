import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const activityPermissions = {
  read: "crm.activity.read",
  create: "crm.activity.create",
  update: "crm.activity.update",
  delete: "crm.activity.delete",
} as const satisfies Record<string, CatalogPermission>;
