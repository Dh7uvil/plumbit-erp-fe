import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const SHIPMENT_WORKFLOW_ACTIONS = [
  "dispatch",
  "arrive",
  "close",
  "cancel",
  "delete",
  "tracking",
] as const;
export type ShipmentWorkflowAction = (typeof SHIPMENT_WORKFLOW_ACTIONS)[number];

export const SHIPMENT_ACTION_REGISTRY: DocumentActionSpec<ShipmentWorkflowAction>[] = [
  {
    action: "dispatch",
    label: "Dispatch",
    permission: shipmentPermissions.dispatch,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be dispatched. This is a tracking state — stock already moved on the delivery note.`,
  },
  {
    action: "arrive",
    label: "Mark arrived",
    permission: shipmentPermissions.dispatch,
    confirmCopy: (documentNumber) => `${documentNumber} will be marked arrived. Stock is unchanged.`,
  },
  {
    action: "close",
    label: "Close",
    permission: shipmentPermissions.close,
    confirmCopy: (documentNumber) => `${documentNumber} will be closed. Stock is unchanged.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: shipmentPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) => `${documentNumber} will be cancelled. Stock is unchanged.`,
  },
  {
    action: "delete",
    label: "Delete",
    permission: shipmentPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft shipments can be deleted.`,
  },
  {
    action: "tracking",
    label: "Update tracking",
    permission: shipmentPermissions.update,
    variant: "outline",
  },
];
