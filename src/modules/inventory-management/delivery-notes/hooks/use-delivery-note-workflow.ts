"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelDeliveryNote,
  useDeleteDeliveryNote,
  usePostDeliveryNote,
} from "@/modules/inventory-management/delivery-notes/mutations";
import type { DeliveryNote } from "@/modules/inventory-management/delivery-notes/schemas";
import type { DeliveryNoteWorkflowAction } from "@/modules/inventory-management/delivery-notes/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useDeliveryNoteWorkflow(note: DeliveryNote) {
  const router = useRouter();
  const postNote = usePostDeliveryNote();
  const cancelNote = useCancelDeliveryNote();
  const deleteNote = useDeleteDeliveryNote();
  const write = { id: note.id, version: note.version };

  return async function onAction(action: DeliveryNoteWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "post") {
      await postNote.mutateAsync(write);
      toast.success("Delivery note posted");
    } else if (action === "cancel") {
      await cancelNote.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Delivery note cancelled");
    } else if (action === "delete") {
      await deleteNote.mutateAsync(write);
      toast.success("Delivery note deleted");
      router.push("/delivery-notes");
    } else if (action === "create_return") {
      router.push(`/sales-returns/new?delivery_note_id=${note.id}`);
    }
  };
}
