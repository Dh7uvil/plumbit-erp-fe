"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelCreditNote,
  useDeleteCreditNote,
  usePostCreditNote,
} from "@/modules/erp/credit-notes/mutations";
import type { CreditNote } from "@/modules/erp/credit-notes/schemas";
import type { CreditNoteWorkflowAction } from "@/modules/erp/credit-notes/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useCreditNoteWorkflow(note: CreditNote) {
  const router = useRouter();
  const postNote = usePostCreditNote();
  const cancelNote = useCancelCreditNote();
  const deleteNote = useDeleteCreditNote();
  const write = { id: note.id, version: note.version };

  return async function onAction(action: CreditNoteWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "post") {
      await postNote.mutateAsync(write);
      toast.success("Credit note posted");
    } else if (action === "cancel") {
      await cancelNote.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Credit note cancelled");
    } else if (action === "delete") {
      await deleteNote.mutateAsync(write);
      toast.success("Credit note deleted");
      router.push("/credit-notes");
    }
  };
}
