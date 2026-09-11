"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConvertSalesOrderToProformaInvoice } from "@/modules/erp/sales-orders/mutations";
import type { SalesOrder } from "@/modules/erp/sales-orders/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  ConversionLinePicker,
  conversionLinesPayload,
  defaultConversionQuantities,
  remainingConversionQty,
  type ConversionSourceLine,
} from "@/shared/components/document/conversion-line-picker";
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

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CreateProformaInvoiceFromSalesOrderDialog({
  salesOrder,
  open,
  onOpenChange,
}: {
  salesOrder: SalesOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateProformaInvoiceFromSalesOrderForm
          salesOrder={salesOrder}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function CreateProformaInvoiceFromSalesOrderForm({
  salesOrder,
  onOpenChange,
}: {
  salesOrder: SalesOrder;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const convert = useConvertSalesOrderToProformaInvoice();
  const lines = useMemo<ConversionSourceLine[]>(
    () =>
      salesOrder.lines.map((line) => ({
        id: line.id,
        line_number: line.line_number,
        description: line.description,
        quantity: line.quantity,
        qty_converted: line.qty_converted,
        qty_remaining: remainingConversionQty({
          quantity: line.quantity,
          qty_converted: line.qty_converted,
          qty_remaining: line.qty_remaining_to_invoice,
        }),
      })),
    [salesOrder.lines],
  );
  const [proformaDate, setProformaDate] = useState(todayIsoDate);
  const [validUntil, setValidUntil] = useState("");
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
        id: salesOrder.id,
        version: salesOrder.version,
        values: {
          proforma_date: proformaDate || null,
          valid_until: validUntil || null,
          lines: selected,
        },
      });
      toast.success("Proforma invoice created");
      onOpenChange(false);
      router.push(`/proforma-invoices/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Create proforma invoice</DialogTitle>
        <DialogDescription>
          Raise a proforma invoice from this sales order. Remaining quantity is converted unless
          you change the amounts below.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="so-pfi-date">Proforma date</Label>
          <Input
            id="so-pfi-date"
            type="date"
            value={proformaDate}
            onChange={(event) => setProformaDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="so-pfi-valid-until">Valid until</Label>
          <Input
            id="so-pfi-valid-until"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
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
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
