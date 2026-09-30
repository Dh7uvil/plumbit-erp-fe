import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const leadSourcePermissions = {
  read: "crm.lead_source.read",
  create: "crm.lead_source.create",
  update: "crm.lead_source.update",
  delete: "crm.lead_source.delete",
} as const satisfies Record<string, CatalogPermission>;
