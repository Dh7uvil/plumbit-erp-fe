import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const CREDIT_NOTE_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type CreditNoteWorkflowAction = (typeof CREDIT_NOTE_WORKFLOW_ACTIONS)[number];

export const CREDIT_NOTE_ACTION_REGISTRY: DocumentActionSpec<CreditNoteWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: creditNotePermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: AR, revenue, and VAT will reverse. Stock will not move.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: creditNotePermissions.cancel,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be voided by reversal when the API allows it.`,
    reasonField: { placeholder: "Why this credit note is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: creditNotePermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft credit notes can be deleted.`,
  },
];
