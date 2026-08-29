import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import type { QuotationStatus } from "@/modules/erp/quotations/schemas";

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
};

const STATUS_ACTIONS: Record<
  QuotationStatus,
  readonly Exclude<QuotationWorkflowAction, "clone">[]
> = {
  DRAFT: ["submit", "send", "cancel"],
  PENDING_APPROVAL: ["approve", "reject", "cancel"],
  REJECTED: ["reopen", "cancel"],
  APPROVED: ["send", "cancel"],
  SENT: ["accept", "decline", "cancel"],
  ACCEPTED: ["cancel"],
  EXPIRED: [],
  DECLINED: [],
  CANCELLED: [],
  CONVERTED: [],
};

const IRREVERSIBLE_ACTIONS = new Set<QuotationWorkflowAction>([
  "approve",
  "reject",
  "send",
  "accept",
  "decline",
  "cancel",
]);

export function isIrreversibleQuotationAction(action: QuotationWorkflowAction): boolean {
  return IRREVERSIBLE_ACTIONS.has(action);
}

export function visibleQuotationActions(
  status: QuotationStatus,
  options: {
    can: (permission: string) => boolean;
    requiresApproval: boolean;
  },
): QuotationWorkflowAction[] {
  let actions: QuotationWorkflowAction[] = [...STATUS_ACTIONS[status]];
  if (status === "DRAFT" && options.requiresApproval) {
    actions = actions.filter((action) => action !== "send");
  }
  actions.push("clone");
  return actions.filter((action) => options.can(QUOTATION_ACTION_PERMISSION[action]));
}
