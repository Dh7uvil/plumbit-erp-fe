"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateGoodsReceiptFromPurchaseOrder } from "@/modules/inventory-management/goods-receipts/mutations";
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
import { formatDate } from "@/shared/lib/format";

export function CreateGoodsReceiptFromPurchaseOrderDialog({
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
        <CreateGoodsReceiptFromPurchaseOrderBody
          purchaseOrderId={purchaseOrderId}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function CreateGoodsReceiptFromPurchaseOrderBody({
  purchaseOrderId,
  onOpenChange,
}: {
  purchaseOrderId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const create = useCreateGoodsReceiptFromPurchaseOrder();
  const [selectedId, setSelectedId] = useState(purchaseOrderId ?? "");
  const [search, setSearch] = useState("");
  const ordersQuery = usePurchaseOrders(
    { status: "ISSUED", page_size: 50, search: search || undefined },
    !purchaseOrderId,
  );
  const orders = ordersQuery.data?.data ?? [];
  const chosenId = purchaseOrderId ?? selectedId;

  async function onSubmit() {
    if (!chosenId) {
      toast.error("Select a purchase order.");
      return;
    }
    try {
      const receipt = await create.mutateAsync({ purchase_order_id: chosenId });
      toast.success("Goods receipt created");
      onOpenChange(false);
      router.push(`/goods-receipts/${receipt.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Create goods receipt from purchase order</DialogTitle>
        <DialogDescription>
          Creates a draft goods receipt against an issued purchase order. Stock moves when the
          receipt is posted.
        </DialogDescription>
      </DialogHeader>
      {purchaseOrderId ? null : (
        <ConversionSourceSelect
          label="Purchase order"
          value={selectedId}
          onValueChange={setSelectedId}
          onSearch={setSearch}
          loading={ordersQuery.isFetching}
          placeholder="Select a purchase order"
          options={orders.map((row) => ({
            value: row.id,
            label: `${purchaseOrderDisplayNumber(row) ?? "Purchase order"} · ${formatDate(row.document_date)}`,
          }))}
          emptyText="No issued purchase orders are available to receive."
        />
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={create.isPending || !chosenId} onClick={onSubmit}>
          {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Create goods receipt
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
