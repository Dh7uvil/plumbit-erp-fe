"use client";

import { useCan } from "@/shared/providers/session-provider";

export type CrudKeys = {
  read: string;
  create?: string;
  update?: string;
  delete?: string;
};

export type CrudPermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type FormDialogMode = "create" | "view" | "edit";

export function crudPermissions(
  can: (permission: string) => boolean,
  permissions: CrudKeys,
): CrudPermissions {
  return {
    canRead: can(permissions.read),
    canCreate: Boolean(permissions.create && can(permissions.create)),
    canUpdate: Boolean(permissions.update && can(permissions.update)),
    canDelete: Boolean(permissions.delete && can(permissions.delete)),
  };
}

export function useCrudPermissions(permissions: CrudKeys): CrudPermissions {
  const can = useCan();
  return crudPermissions(can, permissions);
}

export function resolveFormDialogMode({
  hasRecord,
  canCreate,
  canUpdate,
  forceReadOnly = false,
}: {
  hasRecord: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  forceReadOnly?: boolean;
}): { mode: FormDialogMode; readOnly: boolean; canSubmit: boolean } {
  if (!hasRecord) {
    return {
      mode: "create",
      readOnly: !canCreate,
      canSubmit: canCreate,
    };
  }
  if (canUpdate && !forceReadOnly) {
    return { mode: "edit", readOnly: false, canSubmit: true };
  }
  return { mode: "view", readOnly: true, canSubmit: false };
}

export function formDialogTitle(entityLabel: string, mode: FormDialogMode): string {
  if (mode === "create") {
    return `New ${entityLabel}`;
  }
  if (mode === "edit") {
    return `Edit ${entityLabel}`;
  }
  return `View ${entityLabel}`;
}

export function emptyListMessage(canCreate: boolean, createPrompt: string): string {
  return canCreate ? createPrompt : "No records yet.";
}
