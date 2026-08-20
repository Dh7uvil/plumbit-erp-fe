import type {
  PermissionMatrixAction,
  PermissionMatrixResponse,
} from "@/modules/users-management/permissions/schemas";

const PREFERRED_ACTIONS = ["create", "read", "update", "delete"];

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

export function permissionMatrixTable(matrix: PermissionMatrixResponse): {
  actions: string[];
  rows: PermissionMatrixRow[];
} {
  const actionSet = new Set<string>();
  const rows: PermissionMatrixRow[] = [];

  for (const mod of matrix.modules) {
    for (const resource of mod.resources) {
      const actions: Record<string, PermissionMatrixAction> = {};
      for (const item of resource.actions) {
        actionSet.add(item.action);
        actions[item.action] = item;
      }
      rows.push({ module: mod.module, resource: resource.resource, actions });
    }
  }

  const rest = [...actionSet].filter((action) => !PREFERRED_ACTIONS.includes(action)).sort();
  const actions = [...PREFERRED_ACTIONS.filter((action) => actionSet.has(action)), ...rest];

  return { actions, rows };
}
