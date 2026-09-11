import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const PURCHASE_RETURN_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type PurchaseReturnWorkflowAction = (typeof PURCHASE_RETURN_WORKFLOW_ACTIONS)[number];

export const PURCHASE_RETURN_ACTION_REGISTRY: DocumentActionSpec<PurchaseReturnWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: purchaseReturnPermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: stock will leave against the original goods receipt cost layers. Accounts payable will not change until you create a debit note.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: purchaseReturnPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled. If posted, stock will reverse when the API allows it.`,
    reasonField: { placeholder: "Why this purchase return is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: purchaseReturnPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft purchase returns can be deleted.`,
  },
];
