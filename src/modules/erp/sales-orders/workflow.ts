import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";

export const SALES_ORDER_WORKFLOW_ACTIONS = [
  "submit",
  "approve",
  "reject",
  "reopen",
  "confirm",
  "close",
  "cancel",
  "clone",
  "delete",
] as const;
export type SalesOrderWorkflowAction = (typeof SALES_ORDER_WORKFLOW_ACTIONS)[number];

export const SALES_ORDER_ACTION_PERMISSION: Record<SalesOrderWorkflowAction, string> = {
  submit: salesOrderPermissions.update,
  approve: salesOrderPermissions.approve,
  reject: salesOrderPermissions.approve,
  reopen: salesOrderPermissions.update,
  confirm: salesOrderPermissions.confirm,
  close: salesOrderPermissions.close,
  cancel: salesOrderPermissions.update,
  clone: salesOrderPermissions.create,
  delete: salesOrderPermissions.delete,
};

export const SALES_ORDER_ACTION_LABELS: Record<SalesOrderWorkflowAction, string> = {
  submit: "Submit",
  approve: "Approve",
  reject: "Reject",
  reopen: "Reopen",
  confirm: "Confirm",
  close: "Close",
  cancel: "Cancel",
  clone: "Clone",
  delete: "Delete",
};

const IRREVERSIBLE_ACTIONS = new Set<SalesOrderWorkflowAction>([
  "approve",
  "reject",
  "confirm",
  "close",
  "cancel",
  "delete",
]);

export function isSalesOrderWorkflowAction(value: string): value is SalesOrderWorkflowAction {
  return (SALES_ORDER_WORKFLOW_ACTIONS as readonly string[]).includes(value);
}

export function isIrreversibleSalesOrderAction(action: SalesOrderWorkflowAction): boolean {
  return IRREVERSIBLE_ACTIONS.has(action);
}

export function salesOrderActionEffect(
  action: SalesOrderWorkflowAction,
  documentNumber: string,
): string {
  switch (action) {
    case "submit":
      return `${documentNumber} will be sent for approval.`;
    case "approve":
      return `${documentNumber} will be marked approved and can then be confirmed.`;
    case "reject":
      return `${documentNumber} will be returned to the salesperson.`;
    case "reopen":
      return `${documentNumber} will be reopened.`;
    case "confirm":
      return `${documentNumber} will be confirmed. This does not move stock or post to the ledger.`;
    case "close":
      return `${documentNumber} will be closed.`;
    case "cancel":
      return `${documentNumber} will be cancelled and will no longer be active.`;
    case "clone":
      return `A new draft will be created from ${documentNumber}.`;
    case "delete":
      return `${documentNumber} will be removed. Only draft sales orders can be deleted.`;
  }
}

export function visibleSalesOrderActions(
  availableActions: readonly string[],
  can: (permission: string) => boolean,
): SalesOrderWorkflowAction[] {
  return availableActions
    .filter(isSalesOrderWorkflowAction)
    .filter((action) => can(SALES_ORDER_ACTION_PERMISSION[action]));
}
