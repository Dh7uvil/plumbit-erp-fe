import type {
  PermissionMatrixAction,
  PermissionMatrixResponse,
} from "@/modules/users-management/permissions/schemas";
import { humanizeEnum } from "@/shared/lib/format";

const PREFERRED_ACTIONS = ["create", "read", "update", "delete"];

const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  ar_ap: "AR/AP reports",
  ledger: "Ledger reports",
  tax: "Tax reports",
  inventory: "Inventory reports",
  financial: "Financial reports",
  override: "Override",
  post: "Post",
  cancel: "Cancel",
  approve: "Approve",
  confirm: "Confirm",
  send: "Send",
  retry: "Retry",
  import: "Import",
  export: "Export",
};

export function matrixActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanizeEnum(action);
}

export type PermissionMatrixRow = {
  module: string;
  resource: string;
  actions: Record<string, PermissionMatrixAction>;
};

export function grantedPermissionIds(matrix: PermissionMatrixResponse): string[] {
  return matrix.modules.flatMap((mod) =>
    mod.resources.flatMap((resource) =>
      resource.actions.filter((action) => action.granted).map((action) => action.id),
    ),
  );
}

export function isPermissionMatrix(value: unknown): value is PermissionMatrixResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "modules" in value &&
      Array.isArray((value as PermissionMatrixResponse).modules),
  );
}

export function applyGrantedIds(
  matrix: PermissionMatrixResponse,
  grantedIds: ReadonlySet<string>,
): PermissionMatrixResponse {
  return {
    modules: matrix.modules.map((mod) => ({
      ...mod,
      resources: mod.resources.map((resource) => ({
        ...resource,
        actions: resource.actions.map((action) => ({
          ...action,
          granted: grantedIds.has(action.id),
        })),
      })),
    })),
  };
}

export function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

export function matrixActionColumns(rows: PermissionMatrixRow[]): string[] {
  const actionSet = new Set<string>();
  for (const row of rows) {
    for (const action of Object.keys(row.actions)) {
      actionSet.add(action);
    }
  }
  const rest = [...actionSet].filter((action) => !PREFERRED_ACTIONS.includes(action)).sort();
  return [...PREFERRED_ACTIONS.filter((action) => actionSet.has(action)), ...rest];
}

export function permissionMatrixTable(matrix: PermissionMatrixResponse): {
  actions: string[];
  rows: PermissionMatrixRow[];
} {
  const rows: PermissionMatrixRow[] = [];

  for (const mod of matrix.modules) {
    for (const resource of mod.resources) {
      const actions: Record<string, PermissionMatrixAction> = {};
      for (const item of resource.actions) {
        actions[item.action] = item;
      }
      rows.push({ module: mod.module, resource: resource.resource, actions });
    }
  }

  return { actions: matrixActionColumns(rows), rows };
}
