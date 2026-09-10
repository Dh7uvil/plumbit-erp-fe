import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const JOURNAL_WORKFLOW_ACTIONS = ["post", "cancel", "reverse", "delete"] as const;
export type JournalWorkflowAction = (typeof JOURNAL_WORKFLOW_ACTIONS)[number];

export const JOURNAL_ACTION_REGISTRY: DocumentActionSpec<JournalWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: journalPermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber} writes this entry to the general ledger. Posted journals cannot be edited — correct with a reversal.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: journalPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled. Nothing will post to the ledger.`,
    reasonField: { placeholder: "Why this journal is being cancelled" },
  },
  {
    action: "reverse",
    label: "Reverse",
    permission: journalPermissions.reverse,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `Reversing ${documentNumber} posts a linked mirror entry that swaps debits and credits. The original stays posted.`,
    reasonField: { placeholder: "Why this journal is being reversed" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: journalPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft journals can be deleted.`,
  },
];
