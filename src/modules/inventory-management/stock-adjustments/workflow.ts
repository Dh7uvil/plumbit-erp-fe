import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";

export const STOCK_ADJUSTMENT_WORKFLOW_ACTIONS = ["post", "cancel", "clone", "delete"] as const;
export type StockAdjustmentWorkflowAction = (typeof STOCK_ADJUSTMENT_WORKFLOW_ACTIONS)[number];

export const STOCK_ADJUSTMENT_ACTION_PERMISSION: Record<StockAdjustmentWorkflowAction, string> = {
  post: stockAdjustmentPermissions.post,
  cancel: stockAdjustmentPermissions.update,
  clone: stockAdjustmentPermissions.create,
  delete: stockAdjustmentPermissions.delete,
};

export const STOCK_ADJUSTMENT_ACTION_LABELS: Record<StockAdjustmentWorkflowAction, string> = {
  post: "Post",
  cancel: "Cancel",
  clone: "Clone",
  delete: "Delete",
};

const IRREVERSIBLE_ACTIONS = new Set<StockAdjustmentWorkflowAction>(["post", "cancel", "delete"]);

export function isStockAdjustmentWorkflowAction(
  value: string,
): value is StockAdjustmentWorkflowAction {
  return (STOCK_ADJUSTMENT_WORKFLOW_ACTIONS as readonly string[]).includes(value);
}

export function isIrreversibleStockAdjustmentAction(
  action: StockAdjustmentWorkflowAction,
): boolean {
  return IRREVERSIBLE_ACTIONS.has(action);
}

export function stockAdjustmentActionEffect(
  action: StockAdjustmentWorkflowAction,
  documentNumber: string,
): string {
  switch (action) {
    case "post":
      return `Posting ${documentNumber}: stock will move immediately. This cannot be undone from this document — correct with a new adjustment.`;
    case "cancel":
      return `${documentNumber} will be cancelled. Stock will not move.`;
    case "clone":
      return `A new draft will be created from ${documentNumber}.`;
    case "delete":
      return `${documentNumber} will be removed. Only draft adjustments can be deleted.`;
  }
}

export function visibleStockAdjustmentActions(
  availableActions: readonly string[],
  can: (permission: string) => boolean,
): StockAdjustmentWorkflowAction[] {
  return availableActions
    .filter(isStockAdjustmentWorkflowAction)
    .filter((action) => can(STOCK_ADJUSTMENT_ACTION_PERMISSION[action]));
}
