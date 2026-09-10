import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const SALES_RETURN_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type SalesReturnWorkflowAction = (typeof SALES_RETURN_WORKFLOW_ACTIONS)[number];

export const SALES_RETURN_ACTION_REGISTRY: DocumentActionSpec<SalesReturnWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: salesReturnPermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: stock will move according to each line disposition, restoring original cost, and the general ledger will debit inventory and credit COGS. Restock returns to available, QC hold stays out of sellable stock, and scrap writes the cost off.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: salesReturnPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled. If posted, stock, cost, and the related general ledger entry will reverse when the API allows it.`,
    reasonField: { placeholder: "Why this sales return is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: salesReturnPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft sales returns can be deleted.`,
  },
];
