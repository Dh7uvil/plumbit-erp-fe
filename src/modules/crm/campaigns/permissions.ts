import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const campaignPermissions = {
  read: "crm.campaign.read",
  create: "crm.campaign.create",
  update: "crm.campaign.update",
  delete: "crm.campaign.delete",
} as const satisfies Record<string, CatalogPermission>;
