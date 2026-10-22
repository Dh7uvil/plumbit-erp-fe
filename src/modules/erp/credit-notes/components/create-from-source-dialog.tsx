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
import { useSalesInvoices } from "@/modules/erp/sales-invoices/queries";
import { salesInvoiceDisplayNumber } from "@/modules/erp/sales-invoices/schemas";
import { useSalesReturns } from "@/modules/inventory-management/sales-returns/queries";
import { salesReturnDisplayNumber } from "@/modules/inventory-management/sales-returns/schemas";
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
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export type CreditNoteSourcePick = "sales_invoice" | "sales_return";

export function CreateCreditNoteDialog({
  open,
  onOpenChange,
  salesInvoiceId,
  salesReturnId,
  pickSource,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesInvoiceId?: string;
  salesReturnId?: string;
  pickSource?: CreditNoteSourcePick;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateCreditNoteBody
          salesInvoiceId={salesInvoiceId}
          salesReturnId={salesReturnId}
          pickSource={pickSource}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function CreateCreditNoteBody({
  salesInvoiceId,
  salesReturnId,
  pickSource,
  onOpenChange,
}: {
  salesInvoiceId?: string;
  salesReturnId?: string;
  pickSource?: CreditNoteSourcePick;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const fromInvoice = useCreateCreditNoteFromSalesInvoice();
  const fromReturn = useCreateCreditNoteFromSalesReturn();
  const fromReturnFlow = Boolean(salesReturnId || pickSource === "sales_return");
  const [pickedInvoiceId, setPickedInvoiceId] = useState("");
  const [pickedReturnId, setPickedReturnId] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [returnSearch, setReturnSearch] = useState("");
  const invoicesQuery = useSalesInvoices({
    status: "POSTED",
    page_size: 50,
    search: invoiceSearch || undefined,
  });
  const returnsQuery = useSalesReturns({
    status: "POSTED",
    page_size: 50,
    search: returnSearch || undefined,
  });
  const resolvedInvoiceId = salesInvoiceId ?? pickedInvoiceId;
  const resolvedReturnId = salesReturnId ?? pickedReturnId;
  const [date, setDate] = useState(todayIsoDate());
  const [reason, setReason] = useState<CreditNoteReason>(
    fromReturnFlow ? "GOODS_RETURNED" : "PRICE_ADJUSTMENT",
  );
  const [notes, setNotes] = useState("");
  const pending = fromInvoice.isPending || fromReturn.isPending;
  const needsInvoicePick = pickSource === "sales_invoice" && !salesInvoiceId;
  const needsReturnPick = pickSource === "sales_return" && !salesReturnId;

  async function onSubmit() {
    if (fromReturnFlow) {
      if (!resolvedReturnId) {
        toast.error("Select a sales return.");
        return;
      }
    } else if (!resolvedInvoiceId) {
      toast.error("Select a sales invoice.");
      return;
    }
    try {
      const note = fromReturnFlow
        ? await fromReturn.mutateAsync({
            sales_return_id: resolvedReturnId,
            credit_note_date: date || null,
            reason_code: reason,
            notes: notes.trim() || null,
          })
        : await fromInvoice.mutateAsync({
            sales_invoice_id: resolvedInvoiceId,
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
    <DialogContent className={needsInvoicePick || needsReturnPick ? CONVERT_FROM_DIALOG_CLASSNAME : "sm:max-w-md"}>
      <DialogHeader>
        <DialogTitle>Create credit note</DialogTitle>
        <DialogDescription>
          {fromReturnFlow
            ? "Creates a credit note from a posted sales return. Stock already moved on the return."
            : "Stock will not move. The original invoice stays posted; this note reduces the receivable."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        {needsInvoicePick ? (
          <ConversionSourceSelect
            label="Sales invoice"
            value={pickedInvoiceId}
            onValueChange={setPickedInvoiceId}
            onSearch={setInvoiceSearch}
            loading={invoicesQuery.isFetching}
            placeholder="Select a sales invoice"
            options={(invoicesQuery.data?.data ?? []).map((row) => ({
              value: row.id,
              label: `${salesInvoiceDisplayNumber(row) ?? "Sales invoice"} · ${formatDate(row.invoice_date)}`,
            }))}
            emptyText="No posted sales invoices are available."
          />
        ) : null}
        {needsReturnPick ? (
          <ConversionSourceSelect
            label="Sales return"
            value={pickedReturnId}
            onValueChange={setPickedReturnId}
            onSearch={setReturnSearch}
            loading={returnsQuery.isFetching}
            placeholder="Select a sales return"
            options={(returnsQuery.data?.data ?? []).map((row) => ({
              value: row.id,
              label: `${salesReturnDisplayNumber(row) ?? "Sales return"} · ${formatDate(row.document_date)}`,
            }))}
            emptyText="No posted sales returns are available."
          />
        ) : null}
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
          <Textarea
            id="cn-notes"
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
          Create credit note
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
