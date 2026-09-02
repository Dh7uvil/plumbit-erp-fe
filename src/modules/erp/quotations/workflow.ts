import { quotationPermissions } from "@/modules/erp/quotations/permissions";

export const QUOTATION_WORKFLOW_ACTIONS = [
  "submit",
  "approve",
  "reject",
  "reopen",
  "send",
  "accept",
  "decline",
  "cancel",
  "clone",
  "delete",
] as const;
export type QuotationWorkflowAction = (typeof QUOTATION_WORKFLOW_ACTIONS)[number];

export const QUOTATION_ACTION_PERMISSION: Record<QuotationWorkflowAction, string> = {
  submit: quotationPermissions.update,
  approve: quotationPermissions.approve,
  reject: quotationPermissions.approve,
  reopen: quotationPermissions.update,
  send: quotationPermissions.send,
  accept: quotationPermissions.update,
  decline: quotationPermissions.update,
  cancel: quotationPermissions.update,
  clone: quotationPermissions.create,
  delete: quotationPermissions.delete,
};

export const QUOTATION_ACTION_LABELS: Record<QuotationWorkflowAction, string> = {
  submit: "Submit",
  approve: "Approve",
  reject: "Reject",
  reopen: "Reopen",
  send: "Send",
  accept: "Accept",
  decline: "Decline",
  cancel: "Cancel",
  clone: "Clone",
  delete: "Delete",
};

const IRREVERSIBLE_ACTIONS = new Set<QuotationWorkflowAction>([
  "approve",
  "reject",
  "send",
  "accept",
  "decline",
  "cancel",
  "delete",
]);

export function isQuotationWorkflowAction(value: string): value is QuotationWorkflowAction {
  return (QUOTATION_WORKFLOW_ACTIONS as readonly string[]).includes(value);
}

export function isIrreversibleQuotationAction(action: QuotationWorkflowAction): boolean {
  return IRREVERSIBLE_ACTIONS.has(action);
}

export function quotationActionEffect(
  action: QuotationWorkflowAction,
  quoteNumber: string,
): string {
  switch (action) {
    case "submit":
      return `${quoteNumber} will be sent for approval.`;
    case "approve":
      return `${quoteNumber} will be marked approved and can then be sent to the customer.`;
    case "reject":
      return `${quoteNumber} will be returned to the salesperson.`;
    case "reopen":
      return `${quoteNumber} will be reopened as a draft.`;
    case "send":
      return `${quoteNumber} will be sent to the customer.`;
    case "accept":
      return `${quoteNumber} will be marked accepted.`;
    case "decline":
      return `${quoteNumber} will be marked declined.`;
    case "cancel":
      return `${quoteNumber} will be cancelled and will no longer be active.`;
    case "clone":
      return `A new draft will be created from ${quoteNumber}.`;
    case "delete":
      return `${quoteNumber} will be removed. Only draft quotations can be deleted.`;
  }
}

export function visibleQuotationActions(
  availableActions: readonly string[],
  can: (permission: string) => boolean,
): QuotationWorkflowAction[] {
  return availableActions
    .filter(isQuotationWorkflowAction)
    .filter((action) => can(QUOTATION_ACTION_PERMISSION[action]));
}
