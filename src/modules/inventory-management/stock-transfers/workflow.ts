import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const STOCK_TRANSFER_WORKFLOW_ACTIONS = [
  "post",
  "cancel",
  "reverse",
  "clone",
  "delete",
] as const;
export type StockTransferWorkflowAction = (typeof STOCK_TRANSFER_WORKFLOW_ACTIONS)[number];

export const STOCK_TRANSFER_ACTION_REGISTRY: DocumentActionSpec<StockTransferWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: stockTransferPermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: stock will move from the source warehouse to the destination immediately. This cannot be undone from this document — correct with a new transfer.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: stockTransferPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) => `${documentNumber} will be cancelled. Stock will not move.`,
    reasonField: { placeholder: "Why this transfer is being cancelled" },
  },
  {
    action: "reverse",
    label: "Reverse",
    permission: stockTransferPermissions.create,
    confirmCopy: (documentNumber) =>
      `Create a draft reverse transfer for ${documentNumber} (warehouses swapped). Review and post the new transfer to move stock back.`,
  },
  {
    action: "clone",
    label: "Clone",
    permission: stockTransferPermissions.create,
    variant: "outline",
  },
  {
    action: "delete",
    label: "Delete",
    permission: stockTransferPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft transfers can be deleted.`,
  },
];
