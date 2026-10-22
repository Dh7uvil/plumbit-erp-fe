"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useDeliveryNotes } from "@/modules/inventory-management/delivery-notes/queries";
import { deliveryNoteDisplayNumber } from "@/modules/inventory-management/delivery-notes/schemas";
import { ConversionSourceSelect } from "@/shared/components/document/conversion-source-select";
import { CONVERT_FROM_DIALOG_CLASSNAME } from "@/shared/components/document/convert-from-menu";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatDate } from "@/shared/lib/format";

export function CreateSalesReturnFromDeliveryNoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <CreateSalesReturnFromDeliveryNoteBody onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function CreateSalesReturnFromDeliveryNoteBody({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const notesQuery = useDeliveryNotes({
    status: "POSTED",
    page_size: 50,
    search: search || undefined,
  });
  const notes = notesQuery.data?.data ?? [];

  function onContinue() {
    if (!selectedId) {
      toast.error("Select a delivery note.");
      return;
    }
    onOpenChange(false);
    router.push(`/sales-returns/new?delivery_note_id=${selectedId}`);
  }

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Create sales return from delivery note</DialogTitle>
        <DialogDescription>
          Opens a new sales return prefilled from a posted delivery note.
        </DialogDescription>
      </DialogHeader>
      <ConversionSourceSelect
        label="Delivery note"
        value={selectedId}
        onValueChange={setSelectedId}
        onSearch={setSearch}
        loading={notesQuery.isFetching}
        placeholder="Select a delivery note"
        options={notes.map((row) => ({
          value: row.id,
          label: `${deliveryNoteDisplayNumber(row) ?? "Delivery note"} · ${formatDate(row.document_date)}`,
        }))}
        emptyText="No posted delivery notes are available."
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={!selectedId} onClick={onContinue}>
          Continue
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
