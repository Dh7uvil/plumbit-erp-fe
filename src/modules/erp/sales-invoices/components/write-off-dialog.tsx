"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useWriteOffSalesInvoice } from "@/modules/erp/sales-invoices/mutations";
import type { SalesInvoice } from "@/modules/erp/sales-invoices/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatMoney } from "@/shared/lib/format";

export function SalesInvoiceWriteOffDialog({
  invoice,
  currencyCode,
  open,
  onOpenChange,
}: {
  invoice: SalesInvoice;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const writeOff = useWriteOffSalesInvoice();
  const [amount, setAmount] = useState(invoice.balance_due);
  const [writeOffDate, setWriteOffDate] = useState(
    invoice.invoice_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(invoice.balance_due);
      setWriteOffDate(
        invoice.invoice_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      );
      setReason("");
    }
  }, [open, invoice.balance_due, invoice.invoice_date]);

  async function onConfirm() {
    try {
      await writeOff.mutateAsync({
        id: invoice.id,
        version: invoice.version,
        amount,
        writeOffDate,
        reason: reason.trim() || null,
      });
      toast.success("Invoice written off");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ConfirmActionDialog
      open={open}
      title="Write off balance"
      description={`Write off part or all of the open balance on this invoice. Balance due is ${formatMoney(invoice.balance_due, currencyCode)}. This posts bad debt expense against accounts receivable and does not adjust revenue or VAT.`}
      extra={
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="write-off-amount">Amount</Label>
            <Input
              id="write-off-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="write-off-date">Write-off date</Label>
            <Input
              id="write-off-date"
              type="date"
              value={writeOffDate}
              onChange={(event) => setWriteOffDate(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="write-off-reason">Reason (optional)</Label>
            <Textarea
              id="write-off-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
          </div>
        </div>
      }
      confirmLabel="Write off"
      pending={writeOff.isPending}
      variant="default"
      onOpenChange={onOpenChange}
      onConfirm={() => void onConfirm()}
    />
  );
}
