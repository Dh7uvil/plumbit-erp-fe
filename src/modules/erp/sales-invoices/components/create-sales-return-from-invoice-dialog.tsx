"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { SalesInvoice } from "@/modules/erp/sales-invoices/schemas";
import { useDeliveryNote } from "@/modules/inventory-management/delivery-notes/queries";
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

export function deliveryNoteIdsForSalesInvoice(invoice: SalesInvoice): string[] {
  const ids = new Set<string>();
  for (const line of invoice.lines) {
    if (line.delivery_note_id) {
      ids.add(line.delivery_note_id);
    }
  }
  for (const doc of invoice.related_documents ?? []) {
    if (doc.document_type === "DELIVERY_NOTE") {
      ids.add(doc.document_id);
    }
  }
  return [...ids];
}

export function CreateSalesReturnFromSalesInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: SalesInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateSalesReturnFromSalesInvoiceBody invoice={invoice} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function CreateSalesReturnFromSalesInvoiceBody({
  invoice,
  onOpenChange,
}: {
  invoice: SalesInvoice;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const deliveryNoteIds = useMemo(() => deliveryNoteIdsForSalesInvoice(invoice), [invoice]);
  const [selectedId, setSelectedId] = useState(deliveryNoteIds[0] ?? "");
  const detailQuery = useDeliveryNote(
    deliveryNoteIds.length === 1 ? deliveryNoteIds[0] : null,
  );
  const singleNote = detailQuery.data;

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
        <DialogTitle>Create sales return</DialogTitle>
        <DialogDescription>
          Returns are posted against a delivery note. Pick the note that shipped the goods on this
          invoice.
        </DialogDescription>
      </DialogHeader>
      {deliveryNoteIds.length === 1 && singleNote ? (
        <p className="text-muted-foreground text-sm">
          Against delivery note {deliveryNoteDisplayNumber(singleNote) ?? selectedId}
          {singleNote.document_date ? ` · ${formatDate(singleNote.document_date)}` : ""}.
        </p>
      ) : (
        <ConversionSourceSelect
          label="Delivery note"
          value={selectedId}
          onValueChange={setSelectedId}
          onSearch={() => undefined}
          placeholder="Select a delivery note"
          options={deliveryNoteIds.map((id) => {
            const related = invoice.related_documents?.find(
              (doc) => doc.document_type === "DELIVERY_NOTE" && doc.document_id === id,
            );
            const label = related?.document_number ?? "Delivery note";
            const date = related?.document_date;
            return {
              value: id,
              label: date ? `${label} · ${formatDate(date)}` : label,
            };
          })}
          emptyText="No delivery notes are linked to this invoice."
        />
      )}
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
