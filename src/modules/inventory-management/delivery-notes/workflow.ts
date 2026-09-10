import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const DELIVERY_NOTE_WORKFLOW_ACTIONS = ["post", "cancel", "delete", "create_return"] as const;
export type DeliveryNoteWorkflowAction = (typeof DELIVERY_NOTE_WORKFLOW_ACTIONS)[number];

export const DELIVERY_NOTE_ACTION_REGISTRY: DocumentActionSpec<DeliveryNoteWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: deliveryNotePermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: reserved stock will be released, stock will move out, and cost will be consumed. AR will not.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: deliveryNotePermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled. If it is posted, stock and original cost will reverse when the API allows it.`,
    reasonField: { placeholder: "Why this delivery note is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: deliveryNotePermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft delivery notes can be deleted.`,
  },
  {
    action: "create_return",
    label: "Create sales return",
    permission: salesReturnPermissions.create,
    variant: "outline",
  },
];
