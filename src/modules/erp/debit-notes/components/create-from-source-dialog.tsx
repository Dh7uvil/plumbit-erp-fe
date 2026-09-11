"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCreateDebitNoteFromPurchaseInvoice,
  useCreateDebitNoteFromPurchaseReturn,
} from "@/modules/erp/debit-notes/mutations";
import {
  DEBIT_NOTE_REASON_LABELS,
  DEBIT_NOTE_REASONS,
  type DebitNoteReason,
} from "@/modules/erp/debit-notes/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function CreateDebitNoteDialog({
  open,
  onOpenChange,
  purchaseInvoiceId,
  purchaseReturnId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseInvoiceId?: string;
  purchaseReturnId?: string;
}) {
  const router = useRouter();
  const createFromInvoice = useCreateDebitNoteFromPurchaseInvoice();
  const createFromReturn = useCreateDebitNoteFromPurchaseReturn();
  const fromReturn = Boolean(purchaseReturnId);
  const [date, setDate] = useState(todayIsoDate());
  const [reason, setReason] = useState<DebitNoteReason>(
    fromReturn ? "GOODS_REJECTED" : "PRICE_ADJUSTMENT",
  );
  const [notes, setNotes] = useState("");
  const pending = createFromInvoice.isPending || createFromReturn.isPending;

  function resetFields() {
    setDate(todayIsoDate());
    setReason(fromReturn ? "GOODS_REJECTED" : "PRICE_ADJUSTMENT");
    setNotes("");
  }

  async function onSubmit() {
    try {
      const note = fromReturn
        ? await createFromReturn.mutateAsync({
            purchase_return_id: purchaseReturnId!,
            debit_note_date: date || null,
            reason_code: reason,
            notes: notes.trim() || null,
          })
        : await createFromInvoice.mutateAsync({
            purchase_invoice_id: purchaseInvoiceId!,
            debit_note_date: date || null,
            reason_code: reason,
            notes: notes.trim() || null,
          });
      toast.success("Debit note created");
      onOpenChange(false);
      router.push(`/debit-notes/${note.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          resetFields();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create debit note</DialogTitle>
          <DialogDescription>
            {fromReturn
              ? "Stock already moved on the purchase return. This note reduces the payable only."
              : "Stock will not move. The original bill stays posted; this note reduces the payable."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sdn-date">Debit note date</Label>
            <Input
              id="sdn-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as DebitNoteReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEBIT_NOTE_REASONS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {DEBIT_NOTE_REASON_LABELS[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sdn-notes">Notes</Label>
            <Textarea id="sdn-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create debit note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
