"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreatePurchaseInvoiceFromPurchaseOrder } from "@/modules/erp/purchase-invoices/mutations";
import { usePurchaseOrders } from "@/modules/erp/purchase-orders/queries";
import { purchaseOrderDisplayNumber } from "@/modules/erp/purchase-orders/schemas";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDate } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function CreateBillFromPurchaseOrderDialog({
  open,
  onOpenChange,
  purchaseOrderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrderId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateBillFromPurchaseOrderBody
          purchaseOrderId={purchaseOrderId}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function CreateBillFromPurchaseOrderBody({
  purchaseOrderId,
  onOpenChange,
}: {
  purchaseOrderId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createBill = useCreatePurchaseInvoiceFromPurchaseOrder();
  const [selectedId, setSelectedId] = useState(purchaseOrderId ?? "");
  const [search, setSearch] = useState("");
  const ordersQuery = usePurchaseOrders(
    { status: "ISSUED", page_size: 50, search: search || undefined },
    !purchaseOrderId,
  );
  const orders = ordersQuery.data?.data ?? [];
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const chosenId = purchaseOrderId ?? selectedId;

  async function onSubmit() {
    if (!chosenId) {
      toast.error("Select a purchase order.");
      return;
    }
    try {
      const invoice = await createBill.mutateAsync({
        purchase_order_id: chosenId,
        invoice_date: invoiceDate || null,
        notes: notes.trim() || null,
      });
      toast.success("Purchase invoice created");
      onOpenChange(false);
      router.push(`/purchase-invoices/${invoice.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Create bill from purchase order</DialogTitle>
        <DialogDescription>
          Creates a draft goods bill. Stock will not move — the goods receipt already received it.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        {purchaseOrderId ? null : (
          <ConversionSourceSelect
            label="Purchase order"
            value={selectedId}
            onValueChange={setSelectedId}
            onSearch={setSearch}
            loading={ordersQuery.isFetching}
            placeholder="Select a purchase order"
            options={orders.map((order) => ({
              value: order.id,
              label: `${purchaseOrderDisplayNumber(order) ?? "Purchase order"} · ${formatDate(order.document_date)}`,
            }))}
            emptyText="No issued purchase orders are available."
          />
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-from-po-date">Invoice date</Label>
          <Input
            id="pi-from-po-date"
            type="date"
            value={invoiceDate}
            onChange={(event) => setInvoiceDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-from-po-notes">Notes</Label>
          <Textarea
            id="pi-from-po-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={createBill.isPending} onClick={() => void onSubmit()}>
          {createBill.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Create bill
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
