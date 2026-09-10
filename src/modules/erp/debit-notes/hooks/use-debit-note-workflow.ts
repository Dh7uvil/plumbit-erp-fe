"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelDebitNote,
  useDeleteDebitNote,
  usePostDebitNote,
} from "@/modules/erp/debit-notes/mutations";
import type { DebitNote } from "@/modules/erp/debit-notes/schemas";
import type { DebitNoteWorkflowAction } from "@/modules/erp/debit-notes/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useDebitNoteWorkflow(note: DebitNote) {
  const router = useRouter();
  const postNote = usePostDebitNote();
  const cancelNote = useCancelDebitNote();
  const deleteNote = useDeleteDebitNote();
  const write = { id: note.id, version: note.version };

  return async function onAction(action: DebitNoteWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "post") {
      await postNote.mutateAsync(write);
      toast.success("Debit note posted");
    } else if (action === "cancel") {
      await cancelNote.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Debit note cancelled");
    } else if (action === "delete") {
      await deleteNote.mutateAsync(write);
      toast.success("Debit note deleted");
      router.push("/debit-notes");
    }
  };
}
