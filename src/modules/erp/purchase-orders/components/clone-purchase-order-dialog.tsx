"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useClonePurchaseOrder } from "@/modules/erp/purchase-orders/mutations";
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

export function ClonePurchaseOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <ClonePurchaseOrderForm onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function ClonePurchaseOrderForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const clonePurchaseOrder = useClonePurchaseOrder();
  const [pickedId, setPickedId] = useState("");
  const [search, setSearch] = useState("");
  const listQuery = usePurchaseOrders({ page_size: 50, search: search || undefined });
  const cloneable = (listQuery.data?.data ?? []).filter((row) =>
    row.available_actions.includes("clone"),
  );

  async function onSubmit() {
    if (!pickedId) {
      toast.error("Select a purchase order.");
      return;
    }
    try {
      const cloned = await clonePurchaseOrder.mutateAsync(pickedId);
      toast.success("Purchase order cloned");
      onOpenChange(false);
      router.push(`/purchase-orders/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Clone purchase order</DialogTitle>
        <DialogDescription>
          Copies the order as a new draft. It does not consume remaining quantity on the source
          order.
        </DialogDescription>
      </DialogHeader>
      <ConversionSourceSelect
        label="Purchase order"
        value={pickedId}
        onValueChange={setPickedId}
        onSearch={setSearch}
        loading={listQuery.isFetching}
        placeholder="Select a purchase order"
        options={cloneable.map((row) => ({
          value: row.id,
          label: `${purchaseOrderDisplayNumber(row) ?? "Purchase order"} · ${formatDate(row.order_date)}`,
        }))}
        emptyText="No purchase orders are available to clone."
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={clonePurchaseOrder.isPending || !pickedId}
          onClick={() => void onSubmit()}
        >
          {clonePurchaseOrder.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Clone
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
