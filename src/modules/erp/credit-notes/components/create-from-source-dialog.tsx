"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCreateCreditNoteFromSalesInvoice,
  useCreateCreditNoteFromSalesReturn,
} from "@/modules/erp/credit-notes/mutations";
import {
  CREDIT_NOTE_REASON_LABELS,
  CREDIT_NOTE_REASONS,
  type CreditNoteReason,
} from "@/modules/erp/credit-notes/schemas";
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
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CreateCreditNoteDialog({
  open,
  onOpenChange,
  salesInvoiceId,
  salesReturnId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesInvoiceId?: string;
  salesReturnId?: string;
}) {
  const router = useRouter();
  const fromInvoice = useCreateCreditNoteFromSalesInvoice();
  const fromReturn = useCreateCreditNoteFromSalesReturn();
  const [date, setDate] = useState(todayIsoDate());
  const [reason, setReason] = useState<CreditNoteReason>(
    salesReturnId ? "GOODS_RETURNED" : "PRICE_ADJUSTMENT",
  );
  const [notes, setNotes] = useState("");
  const pending = fromInvoice.isPending || fromReturn.isPending;

  async function onSubmit() {
    try {
      const note = salesReturnId
        ? await fromReturn.mutateAsync({
            sales_return_id: salesReturnId,
            credit_note_date: date || null,
            reason_code: reason,
            notes: notes.trim() || null,
          })
        : await fromInvoice.mutateAsync({
            sales_invoice_id: salesInvoiceId!,
            credit_note_date: date || null,
            reason_code: reason,
            notes: notes.trim() || null,
          });
      toast.success("Credit note created");
      onOpenChange(false);
      router.push(`/credit-notes/${note.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create credit note</DialogTitle>
          <DialogDescription>
            Stock will not move. The original invoice stays posted; this note reduces the
            receivable.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cn-date">Credit note date</Label>
            <Input
              id="cn-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as CreditNoteReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_NOTE_REASONS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {CREDIT_NOTE_REASON_LABELS[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cn-notes">Notes</Label>
            <Textarea id="cn-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create credit note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
