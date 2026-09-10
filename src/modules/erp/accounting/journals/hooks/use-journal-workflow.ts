"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelJournal,
  useDeleteJournal,
  usePostJournal,
  useReverseJournal,
} from "@/modules/erp/accounting/journals/mutations";
import type { JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import type { JournalWorkflowAction } from "@/modules/erp/accounting/journals/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useJournalWorkflow(entry: JournalEntry) {
  const router = useRouter();
  const postJournal = usePostJournal();
  const cancelJournal = useCancelJournal();
  const reverseJournal = useReverseJournal();
  const deleteJournal = useDeleteJournal();
  const write = { id: entry.id, version: entry.version };

  return async function onAction(action: JournalWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "post") {
      await postJournal.mutateAsync(write);
      toast.success("Journal posted");
    } else if (action === "cancel") {
      await cancelJournal.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Journal cancelled");
    } else if (action === "reverse") {
      const reversed = await reverseJournal.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Journal reversed");
      router.push(`/journals/${reversed.id}`);
    } else if (action === "delete") {
      await deleteJournal.mutateAsync(write);
      toast.success("Journal deleted");
      router.push("/journals");
    }
  };
}
