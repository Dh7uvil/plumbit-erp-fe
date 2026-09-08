import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";

export const PURCHASE_ORDER_WORKFLOW_ACTIONS = [
  "submit",
  "approve",
  "reject",
  "reopen",
  "issue",
  "close",
  "cancel",
  "clone",
  "delete",
] as const;
export type PurchaseOrderWorkflowAction = (typeof PURCHASE_ORDER_WORKFLOW_ACTIONS)[number];

export const PURCHASE_ORDER_ACTION_PERMISSION: Record<PurchaseOrderWorkflowAction, string> = {
  submit: purchaseOrderPermissions.update,
  approve: purchaseOrderPermissions.approve,
  reject: purchaseOrderPermissions.approve,
  reopen: purchaseOrderPermissions.update,
  issue: purchaseOrderPermissions.issue,
  close: purchaseOrderPermissions.close,
  cancel: purchaseOrderPermissions.update,
  clone: purchaseOrderPermissions.create,
  delete: purchaseOrderPermissions.delete,
};

export const PURCHASE_ORDER_ACTION_LABELS: Record<PurchaseOrderWorkflowAction, string> = {
  submit: "Submit",
  approve: "Approve",
  reject: "Reject",
  reopen: "Reopen",
  issue: "Issue",
  close: "Close",
  cancel: "Cancel",
  clone: "Clone",
  delete: "Delete",
};

const IRREVERSIBLE_ACTIONS = new Set<PurchaseOrderWorkflowAction>([
  "approve",
  "reject",
  "issue",
  "close",
  "cancel",
  "delete",
]);

export function isPurchaseOrderWorkflowAction(value: string): value is PurchaseOrderWorkflowAction {
  return (PURCHASE_ORDER_WORKFLOW_ACTIONS as readonly string[]).includes(value);
}

export function isIrreversiblePurchaseOrderAction(action: PurchaseOrderWorkflowAction): boolean {
  return IRREVERSIBLE_ACTIONS.has(action);
}

export function purchaseOrderActionEffect(
  action: PurchaseOrderWorkflowAction,
  documentNumber: string,
): string {
  switch (action) {
    case "submit":
      return `${documentNumber} will be sent for approval.`;
    case "approve":
      return `${documentNumber} will be marked approved and can then be issued.`;
    case "reject":
      return `${documentNumber} will be returned to purchasing.`;
    case "reopen":
      return `${documentNumber} will be reopened.`;
    case "issue":
      return `${documentNumber} will be issued to the supplier. This does not receive stock or post to the ledger.`;
    case "close":
      return `${documentNumber} will be closed.`;
    case "cancel":
      return `${documentNumber} will be cancelled and will no longer be active.`;
    case "clone":
      return `A new draft will be created from ${documentNumber}.`;
    case "delete":
      return `${documentNumber} will be removed. Only draft purchase orders can be deleted.`;
  }
}

export function visiblePurchaseOrderActions(
  availableActions: readonly string[],
  can: (permission: string) => boolean,
): PurchaseOrderWorkflowAction[] {
  return availableActions
    .filter(isPurchaseOrderWorkflowAction)
    .filter((action) => can(PURCHASE_ORDER_ACTION_PERMISSION[action]));
}
