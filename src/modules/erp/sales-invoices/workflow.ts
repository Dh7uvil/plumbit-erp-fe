import { dunningPermissions } from "@/modules/erp/accounting/dunning-rules/permissions";
import { writeOffPermissions } from "@/modules/erp/accounting/write-offs/permissions";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const SALES_INVOICE_WORKFLOW_ACTIONS = [
  "post",
  "cancel",
  "delete",
  "record_payment",
  "apply_credits",
  "create_credit_note",
  "create_delivery_note",
  "write_off",
  "send_reminder",
] as const;
export type SalesInvoiceWorkflowAction = (typeof SALES_INVOICE_WORKFLOW_ACTIONS)[number];

export const SALES_INVOICE_ACTION_REGISTRY: DocumentActionSpec<SalesInvoiceWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: salesInvoicePermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: AR, revenue, VAT, and the general ledger will move. Stock will not, because the delivery note already moved it. Unapplied PFI advances for this customer settle automatically when that setting is on.`,
  },
  {
    action: "record_payment",
    label: "Record payment",
    permission: customerPaymentPermissions.create,
  },
  {
    action: "apply_credits",
    label: "Apply credits",
    permission: salesInvoicePermissions.update,
  },
  {
    action: "create_credit_note",
    label: "Create credit note",
    permission: creditNotePermissions.create,
    variant: "outline",
  },
  {
    action: "create_delivery_note",
    label: "Create delivery note",
    permission: deliveryNotePermissions.create,
    variant: "outline",
  },
  {
    action: "write_off",
    label: "Write off",
    permission: writeOffPermissions.create,
    variant: "outline",
  },
  {
    action: "send_reminder",
    label: "Send reminder",
    permission: dunningPermissions.send,
    variant: "outline",
    confirmCopy: (documentNumber) =>
      `Queue a payment reminder email for ${documentNumber}? The customer primary contact must have an email address.`,
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
