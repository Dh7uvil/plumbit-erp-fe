"use client";

import { useState } from "react";

import { useSalesOrder, useSalesOrders } from "@/modules/erp/sales-orders/queries";
import { salesOrderDisplayNumber, type SalesOrder } from "@/modules/erp/sales-orders/schemas";
import { DeliveryNoteFromSalesOrderForm } from "@/modules/inventory-management/delivery-notes/components/delivery-note-from-sales-order-form";
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

function isDeliverableSalesOrder(order: Pick<SalesOrder, "status">): boolean {
  return order.status === "CONFIRMED";
}

export function CreateDeliveryNoteFromSalesOrderDialog({
  salesOrder,
  open,
  onOpenChange,
}: {
  salesOrder?: SalesOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateDeliveryNoteFromSalesOrderBody salesOrder={salesOrder} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function CreateDeliveryNoteFromSalesOrderBody({
  salesOrder,
  onOpenChange,
}: {
  salesOrder?: SalesOrder;
  onOpenChange: (open: boolean) => void;
}) {
  const [pickedId, setPickedId] = useState(salesOrder?.id ?? "");
  const [search, setSearch] = useState("");
  const listQuery = useSalesOrders({ page_size: 50, search: search || undefined }, !salesOrder);
  const convertible = (listQuery.data?.data ?? []).filter(isDeliverableSalesOrder);
  const detailQuery = useSalesOrder(salesOrder ? null : pickedId || null);
  const resolved = salesOrder ?? detailQuery.data ?? null;

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Create delivery note from sales order</DialogTitle>
        <DialogDescription>
          Creates a draft delivery note for remaining quantity on a confirmed sales order. Stock
          moves when the note is posted.
        </DialogDescription>
      </DialogHeader>
      {salesOrder ? null : (
        <ConversionSourceSelect
          label="Sales order"
          value={pickedId}
          onValueChange={setPickedId}
          onSearch={setSearch}
          loading={listQuery.isFetching}
          placeholder="Select a sales order"
          options={convertible.map((row) => ({
            value: row.id,
            label: `${salesOrderDisplayNumber(row) ?? "Sales order"} · ${formatDate(row.document_date)}`,
          }))}
          emptyText="No confirmed sales orders are available to deliver."
        />
      )}
      {pickedId && !resolved && detailQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading sales order…</p>
      ) : null}
      {resolved ? (
        <DeliveryNoteFromSalesOrderForm key={resolved.id} salesOrderId={resolved.id} />
      ) : null}
    </DialogContent>
  );
}
