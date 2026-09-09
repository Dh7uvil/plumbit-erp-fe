import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const PROFORMA_INVOICE_WORKFLOW_ACTIONS = [
  "send",
  "confirm",
  "decline",
  "revise",
  "reopen",
  "convert",
  "cancel",
  "clone",
  "delete",
] as const;
export type ProformaInvoiceWorkflowAction = (typeof PROFORMA_INVOICE_WORKFLOW_ACTIONS)[number];

export const PROFORMA_INVOICE_ACTION_REGISTRY: DocumentActionSpec<ProformaInvoiceWorkflowAction>[] =
  [
    {
      action: "send",
      label: "Send",
      permission: proformaInvoicePermissions.send,
      confirmCopy: (documentNumber) => `${documentNumber} will be sent to the customer.`,
    },
    {
      action: "confirm",
      label: "Confirm",
      permission: proformaInvoicePermissions.confirm,
      confirmCopy: (documentNumber) =>
        `Confirming ${documentNumber} records the customer's commitment and makes the advance collectible. The source quotation will be marked accepted.`,
    },
    {
      action: "decline",
      label: "Decline",
      permission: proformaInvoicePermissions.update,
      variant: "destructive",
      confirmCopy: (documentNumber) => `${documentNumber} will be marked declined.`,
      reasonField: { placeholder: "Why this proforma invoice is being declined" },
    },
    {
      action: "revise",
      label: "Revise",
      permission: proformaInvoicePermissions.update,
      variant: "outline",
      confirmCopy: (documentNumber) => `${documentNumber} will return to draft so you can edit it.`,
    },
    { action: "reopen", label: "Reopen", permission: proformaInvoicePermissions.update },
    {
      action: "convert",
      label: "Convert to sales order",
      permission: salesOrderPermissions.create,
    },
    {
      action: "cancel",
      label: "Cancel",
      permission: proformaInvoicePermissions.update,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be cancelled and will no longer be active.`,
      reasonField: { placeholder: "Why this proforma invoice is being cancelled" },
    },
    {
      action: "clone",
      label: "Clone",
      permission: proformaInvoicePermissions.create,
      variant: "outline",
    },
    {
      action: "delete",
      label: "Delete",
      permission: proformaInvoicePermissions.delete,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be removed. Only draft proforma invoices can be deleted.`,
    },
  ];
