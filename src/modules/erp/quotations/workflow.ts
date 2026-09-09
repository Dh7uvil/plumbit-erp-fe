import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const QUOTATION_WORKFLOW_ACTIONS = [
  "submit",
  "approve",
  "reject",
  "reopen",
  "send",
  "accept",
  "decline",
  "revise",
  "create_proforma",
  "convert",
  "cancel",
  "clone",
  "delete",
] as const;
export type QuotationWorkflowAction = (typeof QUOTATION_WORKFLOW_ACTIONS)[number];

export const QUOTATION_ACTION_REGISTRY: DocumentActionSpec<QuotationWorkflowAction>[] = [
  { action: "submit", label: "Submit", permission: quotationPermissions.update },
  {
    action: "approve",
    label: "Approve",
    permission: quotationPermissions.approve,
    confirmCopy: (quoteNumber) =>
      `${quoteNumber} will be marked approved and can then be sent to the customer.`,
  },
  {
    action: "reject",
    label: "Reject",
    permission: quotationPermissions.approve,
    variant: "destructive",
    confirmCopy: (quoteNumber) => `${quoteNumber} will be returned to the salesperson.`,
    reasonField: { placeholder: "Why this quotation is being rejected" },
  },
  { action: "reopen", label: "Reopen", permission: quotationPermissions.update },
  {
    action: "send",
    label: "Send",
    permission: quotationPermissions.send,
    confirmCopy: (quoteNumber) => `${quoteNumber} will be sent to the customer.`,
  },
  {
    action: "accept",
    label: "Accept",
    permission: quotationPermissions.update,
    confirmCopy: (quoteNumber) => `${quoteNumber} will be marked accepted.`,
  },
  {
    action: "decline",
    label: "Decline",
    permission: quotationPermissions.update,
    variant: "destructive",
    confirmCopy: (quoteNumber) => `${quoteNumber} will be marked declined.`,
  },
  {
    action: "revise",
    label: "Revise",
    permission: quotationPermissions.revise,
    variant: "outline",
    confirmCopy: (quoteNumber) =>
      `${quoteNumber} will return to draft so you can edit it. The current version is kept in revision history.`,
    reasonField: {
      label: "Reason for revision",
      placeholder: "Why this quotation is being revised",
      required: true,
    },
  },
  {
    action: "create_proforma",
    label: "Create proforma invoice",
    permission: proformaInvoicePermissions.create,
  },
  {
    action: "convert",
    label: "Convert to sales order",
    permission: salesOrderPermissions.create,
    confirmCopy: (quoteNumber) => `${quoteNumber} will be converted to a sales order.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: quotationPermissions.update,
    variant: "destructive",
    confirmCopy: (quoteNumber) => `${quoteNumber} will be cancelled and will no longer be active.`,
  },
  {
    action: "clone",
    label: "Clone",
    permission: quotationPermissions.create,
    variant: "outline",
  },
  {
    action: "delete",
    label: "Delete",
    permission: quotationPermissions.delete,
    variant: "destructive",
    confirmCopy: (quoteNumber) =>
      `${quoteNumber} will be removed. Only draft quotations can be deleted.`,
  },
];
