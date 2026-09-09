import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

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

export const PURCHASE_ORDER_ACTION_REGISTRY: DocumentActionSpec<PurchaseOrderWorkflowAction>[] = [
  { action: "submit", label: "Submit", permission: purchaseOrderPermissions.update },
  {
    action: "approve",
    label: "Approve",
    permission: purchaseOrderPermissions.approve,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be marked approved and can then be issued.`,
  },
  {
    action: "reject",
    label: "Reject",
    permission: purchaseOrderPermissions.approve,
    variant: "destructive",
    confirmCopy: (documentNumber) => `${documentNumber} will be returned to purchasing.`,
    reasonField: { placeholder: "Why this purchase order is being rejected" },
  },
  { action: "reopen", label: "Reopen", permission: purchaseOrderPermissions.update },
  {
    action: "issue",
    label: "Issue",
    permission: purchaseOrderPermissions.issue,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be issued to the supplier. This does not receive stock or post to the ledger.`,
  },
  {
    action: "close",
    label: "Close",
    permission: purchaseOrderPermissions.close,
    confirmCopy: (documentNumber) => `${documentNumber} will be closed.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: purchaseOrderPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled and will no longer be active.`,
    reasonField: { placeholder: "Why this purchase order is being cancelled" },
  },
  {
    action: "clone",
    label: "Clone",
    permission: purchaseOrderPermissions.create,
    variant: "outline",
  },
  {
    action: "delete",
    label: "Delete",
    permission: purchaseOrderPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft purchase orders can be deleted.`,
  },
];
