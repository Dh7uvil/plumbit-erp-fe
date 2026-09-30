import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const fxRevaluationPermissions = {
  read: "accounting.fx_revaluation.read",
  run: "accounting.fx_revaluation.run",
  reverse: "accounting.fx_revaluation.reverse",
} as const satisfies Record<string, CatalogPermission>;
