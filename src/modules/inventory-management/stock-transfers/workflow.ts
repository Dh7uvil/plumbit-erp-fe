import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";

export const STOCK_TRANSFER_WORKFLOW_ACTIONS = ["post", "cancel", "clone", "delete"] as const;
export type StockTransferWorkflowAction = (typeof STOCK_TRANSFER_WORKFLOW_ACTIONS)[number];

export const STOCK_TRANSFER_ACTION_PERMISSION: Record<StockTransferWorkflowAction, string> = {
  post: stockTransferPermissions.post,
  cancel: stockTransferPermissions.update,
  clone: stockTransferPermissions.create,
  delete: stockTransferPermissions.delete,
};

export const STOCK_TRANSFER_ACTION_LABELS: Record<StockTransferWorkflowAction, string> = {
  post: "Post",
  cancel: "Cancel",
  clone: "Clone",
  delete: "Delete",
};

const IRREVERSIBLE_ACTIONS = new Set<StockTransferWorkflowAction>(["post", "cancel", "delete"]);

export function isStockTransferWorkflowAction(value: string): value is StockTransferWorkflowAction {
  return (STOCK_TRANSFER_WORKFLOW_ACTIONS as readonly string[]).includes(value);
}

export function isIrreversibleStockTransferAction(action: StockTransferWorkflowAction): boolean {
  return IRREVERSIBLE_ACTIONS.has(action);
}

export function stockTransferActionEffect(
  action: StockTransferWorkflowAction,
  documentNumber: string,
): string {
  switch (action) {
    case "post":
      return `Posting ${documentNumber}: stock will move from the source warehouse to the destination immediately. This cannot be undone from this document — correct with a new transfer.`;
    case "cancel":
      return `${documentNumber} will be cancelled. Stock will not move.`;
    case "clone":
      return `A new draft will be created from ${documentNumber}.`;
    case "delete":
      return `${documentNumber} will be removed. Only draft transfers can be deleted.`;
  }
}

export function visibleStockTransferActions(
  availableActions: readonly string[],
  can: (permission: string) => boolean,
): StockTransferWorkflowAction[] {
  return availableActions
    .filter(isStockTransferWorkflowAction)
    .filter((action) => can(STOCK_TRANSFER_ACTION_PERMISSION[action]));
}
