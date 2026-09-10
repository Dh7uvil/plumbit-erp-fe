"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useCreateSalesInvoiceFromDeliveryNotes } from "@/modules/erp/sales-invoices/mutations";
import { useDeliveryNotes } from "@/modules/inventory-management/delivery-notes/queries";
import {
  deliveryNoteDisplayNumber,
  type DeliveryNote,
} from "@/modules/inventory-management/delivery-notes/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDate } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CreateInvoiceFromDeliveryNotesDialog({
  open,
  onOpenChange,
  customerId,
  presetNoteIds = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  presetNoteIds?: string[];
}) {
  const router = useRouter();
  const createInvoice = useCreateSalesInvoiceFromDeliveryNotes();
  const notesQuery = useDeliveryNotes(
    { status: "POSTED", page_size: 100, customer_id: customerId },
    open,
  );
  const notes = notesQuery.data?.data ?? [];
  const [selected, setSelected] = useState<string[]>(presetNoteIds);
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate());
  const [invoiceNotes, setInvoiceNotes] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id),
    );
  }

  async function onSubmit() {
    if (selected.length === 0) {
      toast.error("Select at least one delivery note.");
      return;
    }
    try {
      const invoice = await createInvoice.mutateAsync({
        delivery_note_ids: selected,
        invoice_date: invoiceDate || null,
        notes: invoiceNotes.trim() || null,
      });
      toast.success("Sales invoice created");
      onOpenChange(false);
      router.push(`/sales-invoices/${invoice.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setSelected(presetNoteIds);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create invoice from delivery notes</DialogTitle>
          <DialogDescription>
            One invoice can cover several posted dispatches for the same customer. Stock will not
            move.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-from-dn-date">Invoice date</Label>
            <Input
              id="si-from-dn-date"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
            />
          </div>
          <fieldset className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border p-3">
            <legend className="text-sm font-medium">Posted delivery notes</legend>
            {notesQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading delivery notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No posted delivery notes available.</p>
            ) : (
              notes.map((note: DeliveryNote) => (
                <label key={note.id} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={selectedSet.has(note.id)}
                    onCheckedChange={(checked) => toggle(note.id, checked === true)}
                  />
                  <span>
                    {deliveryNoteDisplayNumber(note) ?? "Delivery note"} ·{" "}
                    {formatDate(note.document_date)}
                  </span>
                </label>
              ))
            )}
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-from-dn-notes">Notes</Label>
            <Textarea
              id="si-from-dn-notes"
              value={invoiceNotes}
              onChange={(event) => setInvoiceNotes(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={createInvoice.isPending} onClick={() => void onSubmit()}>
            {createInvoice.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
