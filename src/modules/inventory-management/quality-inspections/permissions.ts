import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const qualityInspectionPermissions = {
  read: "purchase.quality_inspection.read",
  create: "purchase.quality_inspection.create",
  update: "purchase.quality_inspection.update",
  approve: "purchase.quality_inspection.approve",
} as const satisfies Record<string, CatalogPermission>;
