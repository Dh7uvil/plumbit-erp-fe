import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const pipelinePermissions = {
  read: "crm.pipeline.read",
  create: "crm.pipeline.create",
  update: "crm.pipeline.update",
  delete: "crm.pipeline.delete",
} as const satisfies Record<string, CatalogPermission>;
