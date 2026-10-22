"use client";

import { useState } from "react";

import { CreateProformaInvoiceDialog } from "@/modules/erp/quotations/components/create-proforma-invoice-dialog";
import { useQuotation, useQuotations } from "@/modules/erp/quotations/queries";
import { quotationDisplayNumber, type Quotation } from "@/modules/erp/quotations/schemas";
import { ConversionSourceSelect } from "@/shared/components/document/conversion-source-select";
import { CONVERT_FROM_DIALOG_CLASSNAME } from "@/shared/components/document/convert-from-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatDate } from "@/shared/lib/format";

const PROFORMA_SOURCE_STATUSES = new Set([
  "APPROVED",
  "SENT",
  "ACCEPTED",
  "PARTIALLY_CONVERTED",
]);

function canRaiseProforma(quotation: Pick<Quotation, "status">): boolean {
  return PROFORMA_SOURCE_STATUSES.has(quotation.status);
}

export function CreateProformaInvoiceFromQuotationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return open ? (
    <CreateProformaInvoiceFromQuotationBody open={open} onOpenChange={onOpenChange} />
  ) : null;
}

function CreateProformaInvoiceFromQuotationBody({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pickedId, setPickedId] = useState("");
  const [search, setSearch] = useState("");
  const listQuery = useQuotations({ page_size: 50, search: search || undefined });
  const convertible = (listQuery.data?.data ?? []).filter(canRaiseProforma);
  const detailQuery = useQuotation(pickedId || null);
  const resolved = detailQuery.data ?? null;

  if (resolved) {
    return (
      <CreateProformaInvoiceDialog quotation={resolved} open={open} onOpenChange={onOpenChange} />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
        <DialogHeader>
          <DialogTitle>Create proforma invoice from quotation</DialogTitle>
          <DialogDescription>
            Raises a proforma invoice from an approved or sent quotation.
          </DialogDescription>
        </DialogHeader>
        <ConversionSourceSelect
          label="Quotation"
          value={pickedId}
          onValueChange={setPickedId}
          onSearch={setSearch}
          loading={listQuery.isFetching}
          placeholder="Select a quotation"
          options={convertible.map((row) => ({
            value: row.id,
            label: `${quotationDisplayNumber(row) ?? "Quotation"} · ${formatDate(row.quote_date)}`,
          }))}
          emptyText="No quotations are available for proforma."
        />
        {pickedId && detailQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading quotation…</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
