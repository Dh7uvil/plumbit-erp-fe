import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const STOCK_ADJUSTMENT_WORKFLOW_ACTIONS = ["post", "cancel", "clone", "delete"] as const;
export type StockAdjustmentWorkflowAction = (typeof STOCK_ADJUSTMENT_WORKFLOW_ACTIONS)[number];

export const STOCK_ADJUSTMENT_ACTION_REGISTRY: DocumentActionSpec<StockAdjustmentWorkflowAction>[] =
  [
    {
      action: "post",
      label: "Post",
      permission: stockAdjustmentPermissions.post,
      confirmCopy: (documentNumber) =>
        `Posting ${documentNumber}: stock will move immediately, inventory value will be created at each line's unit cost, and the general ledger will move. This cannot be undone from this document — correct with a new adjustment.`,
    },
    {
      action: "cancel",
      label: "Cancel",
      permission: stockAdjustmentPermissions.update,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be cancelled. If it is posted, the related general ledger entry will reverse when the API allows it. Stock will not move from a draft cancel.`,
      reasonField: { placeholder: "Why this adjustment is being cancelled" },
    },
    {
      action: "clone",
      label: "Clone",
      permission: stockAdjustmentPermissions.create,
      variant: "outline",
    },
    {
      action: "delete",
      label: "Delete",
      permission: stockAdjustmentPermissions.delete,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be removed. Only draft adjustments can be deleted.`,
    },
  ];
