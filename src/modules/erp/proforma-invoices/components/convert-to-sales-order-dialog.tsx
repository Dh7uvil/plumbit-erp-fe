"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useConvertProformaInvoiceToSalesOrder } from "@/modules/erp/proforma-invoices/mutations";
import { useProformaInvoice, useProformaInvoices } from "@/modules/erp/proforma-invoices/queries";
import {
  proformaInvoiceDisplayNumber,
  type ProformaInvoice,
} from "@/modules/erp/proforma-invoices/schemas";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
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
import { MasterSelect } from "@/shared/components/form/master-select";
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

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

export function ConvertProformaToSalesOrderDialog({
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
        <ConvertProformaToSalesOrderBody invoice={invoice} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function ConvertProformaToSalesOrderBody({
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
    row.available_actions.includes("convert"),
  );
  const detailQuery = useProformaInvoice(invoice ? null : pickedId || null);
  const resolved = invoice ?? detailQuery.data ?? null;

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Convert proforma to sales order</DialogTitle>
        <DialogDescription>
          Convert a confirmed proforma invoice. Omit line quantities to convert all remaining
          quantity. Capture the customer PO if it arrived with the confirmation.
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
        <ConvertProformaToSalesOrderForm
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

function ConvertProformaToSalesOrderForm({
  invoice,
  onOpenChange,
}: {
  invoice: ProformaInvoice;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const convert = useConvertProformaInvoiceToSalesOrder();
  const warehousesQuery = useAllWarehouses();
  const warehouses = warehousesQuery.data ?? [];
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
  const [orderDate, setOrderDate] = useState(todayIsoDate);
  const [expectedShipmentDate, setExpectedShipmentDate] = useState(
    invoice.expected_shipment_date ?? "",
  );
  const [warehouseId, setWarehouseId] = useState(OPTIONAL_SELECT_NONE);
  const [customerPoNumber, setCustomerPoNumber] = useState("");
  const [customerPoDate, setCustomerPoDate] = useState("");
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
        id: invoice.id,
        version: invoice.version,
        values: {
          order_date: orderDate || null,
          expected_shipment_date: expectedShipmentDate || null,
          warehouse_id: optionalUuid(warehouseId),
          customer_po_number: customerPoNumber.trim() || null,
          customer_po_date: customerPoDate || null,
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
          <Label htmlFor="pfi-so-date">Order date</Label>
          <Input
            id="pfi-so-date"
            type="date"
            value={orderDate}
            onChange={(event) => setOrderDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pfi-so-ship">Expected shipment</Label>
          <Input
            id="pfi-so-ship"
            type="date"
            value={expectedShipmentDate}
            onChange={(event) => setExpectedShipmentDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Warehouse</Label>
          <MasterSelect
            value={warehouseId}
            onValueChange={setWarehouseId}
            disabled={warehousesQuery.isLoading}
            placeholder="None"
            searchPlaceholder="Search warehouse…"
            asFormControl={false}
            aria-label="Warehouse"
            options={[
              { value: OPTIONAL_SELECT_NONE, label: "None" },
              ...warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: warehouse.name,
              })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pfi-so-po">Customer PO number</Label>
          <Input
            id="pfi-so-po"
            maxLength={60}
            value={customerPoNumber}
            onChange={(event) => setCustomerPoNumber(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pfi-so-po-date">Customer PO date</Label>
          <Input
            id="pfi-so-po-date"
            type="date"
            value={customerPoDate}
            onChange={(event) => setCustomerPoDate(event.target.value)}
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
