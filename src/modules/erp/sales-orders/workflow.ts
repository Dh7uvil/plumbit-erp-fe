import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const SALES_ORDER_WORKFLOW_ACTIONS = [
  "submit",
  "approve",
  "reject",
  "reopen",
  "confirm",
  "close",
  "acknowledge",
  "cancel",
  "clone",
  "delete",
] as const;
export type SalesOrderWorkflowAction = (typeof SALES_ORDER_WORKFLOW_ACTIONS)[number];

export const SALES_ORDER_ACTION_REGISTRY: DocumentActionSpec<SalesOrderWorkflowAction>[] = [
  { action: "submit", label: "Submit", permission: salesOrderPermissions.update },
  {
    action: "approve",
    label: "Approve",
    permission: salesOrderPermissions.approve,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be marked approved and can then be confirmed.`,
  },
  {
    action: "reject",
    label: "Reject",
    permission: salesOrderPermissions.approve,
    variant: "destructive",
    confirmCopy: (documentNumber) => `${documentNumber} will be returned to the salesperson.`,
    reasonField: { placeholder: "Why this sales order is being rejected" },
  },
  { action: "reopen", label: "Reopen", permission: salesOrderPermissions.update },
  {
    action: "confirm",
    label: "Confirm",
    permission: salesOrderPermissions.confirm,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be confirmed. This does not move stock or post to the ledger.`,
  },
  {
    action: "close",
    label: "Close",
    permission: salesOrderPermissions.close,
    confirmCopy: (documentNumber) => `${documentNumber} will be closed.`,
  },
  {
    action: "acknowledge",
    label: "Acknowledge",
    permission: salesOrderPermissions.acknowledge,
    confirmCopy: (documentNumber) =>
      `Acknowledgement of ${documentNumber} is recorded against the customer's PO. This does not change the order status.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: salesOrderPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled and will no longer be active.`,
    reasonField: { placeholder: "Why this sales order is being cancelled" },
  },
  {
    action: "clone",
    label: "Clone",
    permission: salesOrderPermissions.create,
    variant: "outline",
  },
  {
    action: "delete",
    label: "Delete",
    permission: salesOrderPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft sales orders can be deleted.`,
  },
];
