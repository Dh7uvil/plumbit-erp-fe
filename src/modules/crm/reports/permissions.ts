import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const crmReportPermissions = {
  read: "reports.report.crm",
  export: "reports.report.export",
} as const satisfies Record<string, CatalogPermission>;
