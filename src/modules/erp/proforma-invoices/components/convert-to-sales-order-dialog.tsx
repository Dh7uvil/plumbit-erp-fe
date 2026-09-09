"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useConvertProformaInvoiceToSalesOrder } from "@/modules/erp/proforma-invoices/mutations";
import type { ProformaInvoice } from "@/modules/erp/proforma-invoices/schemas";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { getErrorMessage } from "@/shared/api/errors";
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
  invoice: ProformaInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const convert = useConvertProformaInvoiceToSalesOrder();
  const warehousesQuery = useAllWarehouses(open);
  const warehouses = warehousesQuery.data ?? [];
  const [orderDate, setOrderDate] = useState(todayIsoDate());
  const [expectedShipmentDate, setExpectedShipmentDate] = useState(
    invoice.expected_shipment_date ?? "",
  );
  const [warehouseId, setWarehouseId] = useState(OPTIONAL_SELECT_NONE);
  const [customerPoNumber, setCustomerPoNumber] = useState("");
  const [customerPoDate, setCustomerPoDate] = useState("");

  async function onSubmit() {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to sales order</DialogTitle>
          <DialogDescription>
            This marks the proforma invoice and its source quotation as converted. Capture the
            customer PO if it arrived with the confirmation.
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
