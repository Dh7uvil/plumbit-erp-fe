import { writeOffPermissions } from "@/modules/erp/accounting/write-offs/permissions";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const PURCHASE_INVOICE_WORKFLOW_ACTIONS = [
  "post",
  "cancel",
  "delete",
  "pay_bill",
  "apply_debits",
  "create_debit_note",
  "create_landed_cost",
  "write_off",
] as const;
export type PurchaseInvoiceWorkflowAction = (typeof PURCHASE_INVOICE_WORKFLOW_ACTIONS)[number];

export const PURCHASE_INVOICE_ACTION_REGISTRY: DocumentActionSpec<PurchaseInvoiceWorkflowAction>[] =
  [
    {
      action: "post",
      label: "Post",
      permission: purchaseInvoicePermissions.post,
      confirmCopy: (documentNumber) =>
        `Posting ${documentNumber}: AP, GRNI, VAT, and the general ledger will move. Stock will not, because the goods receipt already received it. Matching supplier advances settle automatically when that setting is on.`,
    },
    {
      action: "pay_bill",
      label: "Pay bill",
      permission: supplierPaymentPermissions.create,
    },
    {
      action: "apply_debits",
      label: "Apply debits",
      permission: purchaseInvoicePermissions.update,
    },
    {
      action: "create_debit_note",
      label: "Create debit note",
      permission: debitNotePermissions.create,
      variant: "outline",
    },
    {
      action: "create_landed_cost",
      label: "Create landed cost",
      permission: landedCostPermissions.create,
      variant: "outline",
    },
    {
      action: "write_off",
      label: "Write off",
      permission: writeOffPermissions.create,
      variant: "outline",
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
