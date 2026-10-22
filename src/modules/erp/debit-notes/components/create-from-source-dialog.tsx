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
import { usePurchaseInvoices } from "@/modules/erp/purchase-invoices/queries";
import { purchaseInvoiceDisplayNumber } from "@/modules/erp/purchase-invoices/schemas";
import { usePurchaseReturns } from "@/modules/inventory-management/purchase-returns/queries";
import { purchaseReturnDisplayNumber } from "@/modules/inventory-management/purchase-returns/schemas";
import { getErrorMessage } from "@/shared/api/errors";
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
import { formatDate } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export type DebitNoteSourcePick = "purchase_invoice" | "purchase_return";

export function CreateDebitNoteDialog({
  open,
  onOpenChange,
  purchaseInvoiceId,
  purchaseReturnId,
  pickSource,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseInvoiceId?: string;
  purchaseReturnId?: string;
  pickSource?: DebitNoteSourcePick;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
      }}
    >
      {open ? (
        <CreateDebitNoteBody
          purchaseInvoiceId={purchaseInvoiceId}
          purchaseReturnId={purchaseReturnId}
          pickSource={pickSource}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function CreateDebitNoteBody({
  purchaseInvoiceId,
  purchaseReturnId,
  pickSource,
  onOpenChange,
}: {
  purchaseInvoiceId?: string;
  purchaseReturnId?: string;
  pickSource?: DebitNoteSourcePick;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createFromInvoice = useCreateDebitNoteFromPurchaseInvoice();
  const createFromReturn = useCreateDebitNoteFromPurchaseReturn();
  const fromReturnFlow = Boolean(purchaseReturnId || pickSource === "purchase_return");
  const [pickedInvoiceId, setPickedInvoiceId] = useState("");
  const [pickedReturnId, setPickedReturnId] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [returnSearch, setReturnSearch] = useState("");
  const invoicesQuery = usePurchaseInvoices({
    status: "POSTED",
    page_size: 50,
    search: invoiceSearch || undefined,
  });
  const returnsQuery = usePurchaseReturns({
    status: "POSTED",
    page_size: 50,
    search: returnSearch || undefined,
  });
  const resolvedInvoiceId = purchaseInvoiceId ?? pickedInvoiceId;
  const resolvedReturnId = purchaseReturnId ?? pickedReturnId;
  const [date, setDate] = useState(todayIsoDate());
  const [reason, setReason] = useState<DebitNoteReason>(
    fromReturnFlow ? "GOODS_REJECTED" : "PRICE_ADJUSTMENT",
  );
  const [notes, setNotes] = useState("");
  const pending = createFromInvoice.isPending || createFromReturn.isPending;
  const needsInvoicePick = pickSource === "purchase_invoice" && !purchaseInvoiceId;
  const needsReturnPick = pickSource === "purchase_return" && !purchaseReturnId;

  async function onSubmit() {
    if (fromReturnFlow) {
      if (!resolvedReturnId) {
        toast.error("Select a purchase return.");
        return;
      }
    } else if (!resolvedInvoiceId) {
      toast.error("Select a purchase invoice.");
      return;
    }
    try {
      const note = fromReturnFlow
        ? await createFromReturn.mutateAsync({
            purchase_return_id: resolvedReturnId,
            debit_note_date: date || null,
            reason_code: reason,
            notes: notes.trim() || null,
          })
        : await createFromInvoice.mutateAsync({
            purchase_invoice_id: resolvedInvoiceId,
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
    <DialogContent
      className={
        needsInvoicePick || needsReturnPick ? CONVERT_FROM_DIALOG_CLASSNAME : "sm:max-w-md"
      }
    >
      <DialogHeader>
        <DialogTitle>Create debit note</DialogTitle>
        <DialogDescription>
          {fromReturnFlow
            ? "Stock already moved on the purchase return. This note reduces the payable only."
            : "Stock will not move. The original bill stays posted; this note reduces the payable."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        {needsInvoicePick ? (
          <ConversionSourceSelect
            label="Purchase invoice"
            value={pickedInvoiceId}
            onValueChange={setPickedInvoiceId}
            onSearch={setInvoiceSearch}
            loading={invoicesQuery.isFetching}
            placeholder="Select a purchase invoice"
            options={(invoicesQuery.data?.data ?? []).map((row) => ({
              value: row.id,
              label: `${purchaseInvoiceDisplayNumber(row) ?? "Purchase invoice"} · ${formatDate(row.invoice_date)}`,
            }))}
            emptyText="No posted purchase invoices are available."
          />
        ) : null}
        {needsReturnPick ? (
          <ConversionSourceSelect
            label="Purchase return"
            value={pickedReturnId}
            onValueChange={setPickedReturnId}
            onSearch={setReturnSearch}
            loading={returnsQuery.isFetching}
            placeholder="Select a purchase return"
            options={(returnsQuery.data?.data ?? []).map((row) => ({
              value: row.id,
              label: `${purchaseReturnDisplayNumber(row) ?? "Purchase return"} · ${formatDate(row.document_date)}`,
            }))}
            emptyText="No posted purchase returns are available."
          />
        ) : null}
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
          <Textarea
            id="sdn-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
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
  );
}
