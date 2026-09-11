"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConvertQuotationToSalesOrder } from "@/modules/erp/quotations/mutations";
import { useQuotation, useQuotations } from "@/modules/erp/quotations/queries";
import {
  quotationDisplayNumber,
  type Quotation,
} from "@/modules/erp/quotations/schemas";
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
import { formatDate } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function ConvertQuotationToSalesOrderDialog({
  quotation,
  open,
  onOpenChange,
}: {
  quotation?: Quotation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ConvertQuotationToSalesOrderBody quotation={quotation} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function ConvertQuotationToSalesOrderBody({
  quotation,
  onOpenChange,
}: {
  quotation?: Quotation;
  onOpenChange: (open: boolean) => void;
}) {
  const [pickedId, setPickedId] = useState(quotation?.id ?? "");
  const [search, setSearch] = useState("");
  const listQuery = useQuotations({ page_size: 50, search: search || undefined }, !quotation);
  const convertible = (listQuery.data?.data ?? []).filter((row) =>
    row.available_actions.includes("convert"),
  );
  const detailQuery = useQuotation(quotation ? null : pickedId || null);
  const resolved = quotation ?? detailQuery.data ?? null;

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Convert quotation to sales order</DialogTitle>
        <DialogDescription>
          The quotation must be accepted or partially converted. A live proforma invoice blocks this
          path. Omit line quantities to convert all remaining quantity.
        </DialogDescription>
      </DialogHeader>
      {quotation ? null : (
        <ConversionSourceSelect
          label="Quotation"
          value={pickedId}
          onValueChange={setPickedId}
          onSearch={setSearch}
          loading={listQuery.isFetching}
          placeholder="Select a quotation"
          options={convertible.map((row) => ({
            value: row.id,
            label: `${quotationDisplayNumber(row) ?? "Quotation"} · ${formatDate(row.document_date ?? row.quote_date)}`,
          }))}
          emptyText="No quotations are available to convert. A live proforma invoice blocks this path."
        />
      )}
      {pickedId && !resolved && detailQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading quotation…</p>
      ) : null}
      {resolved ? (
        <ConvertQuotationToSalesOrderForm
          key={resolved.id}
          quotation={resolved}
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

function ConvertQuotationToSalesOrderForm({
  quotation,
  onOpenChange,
}: {
  quotation: Quotation;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const convert = useConvertQuotationToSalesOrder();
  const lines = useMemo<ConversionSourceLine[]>(
    () =>
      quotation.lines.map((line) => ({
        id: line.id,
        line_number: line.line_number,
        description: line.description,
        quantity: line.quantity,
        qty_converted: line.qty_converted,
        qty_remaining: remainingConversionQty(line),
      })),
    [quotation.lines],
  );
  const [orderDate, setOrderDate] = useState(todayIsoDate);
  const [customerPoNumber, setCustomerPoNumber] = useState("");
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
      const order = await convert.mutateAsync({
        id: quotation.id,
        version: quotation.version,
        values: {
          order_date: orderDate || null,
          customer_po_number: customerPoNumber.trim() || null,
          lines: isFullRemainingConversion(lines, quantities) ? undefined : selected,
        },
      });
      toast.success("Sales order created");
      onOpenChange(false);
      router.push(`/sales-orders/${order.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quote-so-date">Order date</Label>
          <Input
            id="quote-so-date"
            type="date"
            value={orderDate}
            onChange={(event) => setOrderDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quote-so-po">Customer PO number</Label>
          <Input
            id="quote-so-po"
            maxLength={60}
            value={customerPoNumber}
            onChange={(event) => setCustomerPoNumber(event.target.value)}
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
          Convert
        </Button>
      </DialogFooter>
    </>
  );
}
