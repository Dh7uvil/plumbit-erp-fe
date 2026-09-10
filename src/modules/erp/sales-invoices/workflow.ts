import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const SALES_INVOICE_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type SalesInvoiceWorkflowAction = (typeof SALES_INVOICE_WORKFLOW_ACTIONS)[number];

export const SALES_INVOICE_ACTION_REGISTRY: DocumentActionSpec<SalesInvoiceWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: salesInvoicePermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: AR, revenue, VAT, and the general ledger will move. Stock will not, because the delivery note already moved it.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: salesInvoicePermissions.cancel,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be voided by reversal when the API allows it. Payments and credit notes block a void.`,
    reasonField: { placeholder: "Why this sales invoice is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: salesInvoicePermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft sales invoices can be deleted.`,
  },
];
