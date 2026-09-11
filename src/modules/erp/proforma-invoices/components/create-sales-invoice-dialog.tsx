"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConvertProformaInvoiceToSalesInvoice } from "@/modules/erp/proforma-invoices/mutations";
import { useProformaInvoice, useProformaInvoices } from "@/modules/erp/proforma-invoices/queries";
import {
  proformaInvoiceDisplayNumber,
  type ProformaInvoice,
} from "@/modules/erp/proforma-invoices/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  ConversionLinePicker,
  conversionLinesPayload,
  defaultConversionQuantities,
  isFullRemainingConversion,
  remainingConversionQty,
  type ConversionSourceLine,
} from "@/shared/components/document/conversion-line-picker";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDate } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CreateSalesInvoiceFromProformaDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice?: ProformaInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateSalesInvoiceFromProformaBody invoice={invoice} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function CreateSalesInvoiceFromProformaBody({
  invoice,
  onOpenChange,
}: {
  invoice?: ProformaInvoice;
  onOpenChange: (open: boolean) => void;
}) {
  const [pickedId, setPickedId] = useState(invoice?.id ?? "");
  const [search, setSearch] = useState("");
  const listQuery = useProformaInvoices({ page_size: 50, search: search || undefined }, !invoice);
  const convertible = (listQuery.data?.data ?? []).filter((row) =>
    row.available_actions.includes("create_sales_invoice"),
  );
  const detailQuery = useProformaInvoice(invoice ? null : pickedId || null);
  const resolved = invoice ?? detailQuery.data ?? null;

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Create sales invoice from proforma</DialogTitle>
        <DialogDescription>
          Creates a draft invoice from a confirmed proforma invoice. The proforma does not post to
          the ledger.
        </DialogDescription>
      </DialogHeader>
      {invoice ? null : (
        <ConversionSourceSelect
          label="Proforma invoice"
          value={pickedId}
          onValueChange={setPickedId}
          onSearch={setSearch}
          loading={listQuery.isFetching}
          placeholder="Select a proforma invoice"
          options={convertible.map((row) => ({
            value: row.id,
            label: `${proformaInvoiceDisplayNumber(row) ?? "Proforma"} · ${formatDate(row.document_date ?? row.proforma_date)}`,
          }))}
          emptyText="No confirmed proforma invoices are available to convert."
        />
      )}
      {pickedId && !resolved && detailQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading proforma invoice…</p>
      ) : null}
      {resolved ? (
        <CreateSalesInvoiceFromProformaForm
          key={resolved.id}
          invoice={resolved}
          onOpenChange={onOpenChange}
        />
      ) : (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}

function CreateSalesInvoiceFromProformaForm({
  invoice,
  onOpenChange,
}: {
  invoice: ProformaInvoice;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const convert = useConvertProformaInvoiceToSalesInvoice();
  const lines = useMemo<ConversionSourceLine[]>(
    () =>
      invoice.lines.map((line) => ({
        id: line.id,
        line_number: line.line_number,
        description: line.description,
        quantity: line.quantity,
        qty_converted: line.qty_converted,
        qty_remaining: remainingConversionQty(line),
      })),
    [invoice.lines],
  );
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate);
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    defaultConversionQuantities(lines),
  );

  async function onSubmit() {
    const selected = conversionLinesPayload(quantities);
    if (!selected) {
      toast.error("Enter a quantity on at least one line.");
      return;
    }
    try {
      const created = await convert.mutateAsync({
        id: invoice.id,
        version: invoice.version,
        values: {
          invoice_date: invoiceDate || null,
          notes: notes.trim() || null,
          lines: isFullRemainingConversion(lines, quantities) ? undefined : selected,
        },
      });
      toast.success("Sales invoice created");
      onOpenChange(false);
      router.push(`/sales-invoices/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pfi-si-date">Invoice date</Label>
          <Input
            id="pfi-si-date"
            type="date"
            value={invoiceDate}
            onChange={(event) => setInvoiceDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pfi-si-notes">Notes</Label>
          <Textarea
            id="pfi-si-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        <ConversionLinePicker
          lines={lines}
          values={quantities}
          onChange={(lineId, quantity) =>
            setQuantities((current) => ({ ...current, [lineId]: quantity }))
          }
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={convert.isPending} onClick={() => void onSubmit()}>
          {convert.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Create invoice
        </Button>
      </DialogFooter>
    </>
  );
}
