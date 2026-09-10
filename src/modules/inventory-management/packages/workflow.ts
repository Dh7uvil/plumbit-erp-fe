import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const PACKAGE_WORKFLOW_ACTIONS = ["pack", "cancel", "delete", "print"] as const;
export type PackageWorkflowAction = (typeof PACKAGE_WORKFLOW_ACTIONS)[number];

export const PACKAGE_ACTION_REGISTRY: DocumentActionSpec<PackageWorkflowAction>[] = [
  {
    action: "pack",
    label: "Pack",
    permission: packagePermissions.update,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be marked packed. This does not move stock or change reservations.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: packagePermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) => `${documentNumber} will be cancelled. Stock is unchanged.`,
  },
  {
    action: "delete",
    label: "Delete",
    permission: packagePermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft packages can be deleted.`,
  },
  {
    action: "print",
    label: "Print packing list",
    permission: packagePermissions.read,
    variant: "outline",
  },
];
