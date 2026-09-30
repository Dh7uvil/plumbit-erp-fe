import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const leadPermissions = {
  read: "crm.lead.read",
  create: "crm.lead.create",
  update: "crm.lead.update",
  delete: "crm.lead.delete",
  assign: "crm.lead.assign",
  convert: "crm.lead.convert",
} as const satisfies Record<string, CatalogPermission>;
