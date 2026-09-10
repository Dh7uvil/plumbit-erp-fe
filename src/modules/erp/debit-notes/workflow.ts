import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const DEBIT_NOTE_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type DebitNoteWorkflowAction = (typeof DEBIT_NOTE_WORKFLOW_ACTIONS)[number];

export const DEBIT_NOTE_ACTION_REGISTRY: DocumentActionSpec<DebitNoteWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: debitNotePermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: AP, expense or GRNI, and VAT will reverse. Stock will not move.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: debitNotePermissions.cancel,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be voided by reversal when the API allows it.`,
    reasonField: { placeholder: "Why this debit note is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: debitNotePermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft debit notes can be deleted.`,
  },
];
