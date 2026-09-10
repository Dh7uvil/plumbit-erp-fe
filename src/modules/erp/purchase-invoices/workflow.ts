import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const PURCHASE_INVOICE_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type PurchaseInvoiceWorkflowAction = (typeof PURCHASE_INVOICE_WORKFLOW_ACTIONS)[number];

export const PURCHASE_INVOICE_ACTION_REGISTRY: DocumentActionSpec<PurchaseInvoiceWorkflowAction>[] =
  [
    {
      action: "post",
      label: "Post",
      permission: purchaseInvoicePermissions.post,
      confirmCopy: (documentNumber) =>
        `Posting ${documentNumber}: AP, GRNI, VAT, and the general ledger will move. Stock will not, because the goods receipt already received it.`,
    },
    {
      action: "cancel",
      label: "Cancel",
      permission: purchaseInvoicePermissions.cancel,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be voided by reversal when the API allows it. Payments and debit notes block a void.`,
      reasonField: { placeholder: "Why this bill is being cancelled" },
    },
    {
      action: "delete",
      label: "Delete",
      permission: purchaseInvoicePermissions.delete,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be removed. Only draft bills can be deleted.`,
    },
  ];
