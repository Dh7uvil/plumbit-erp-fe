"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCloneSalesOrder } from "@/modules/erp/sales-orders/mutations";
import { useSalesOrders } from "@/modules/erp/sales-orders/queries";
import { salesOrderDisplayNumber } from "@/modules/erp/sales-orders/schemas";
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

export function CloneSalesOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <CloneSalesOrderForm onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function CloneSalesOrderForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const cloneSalesOrder = useCloneSalesOrder();
  const [pickedId, setPickedId] = useState("");
  const [search, setSearch] = useState("");
  const listQuery = useSalesOrders({ page_size: 50, search: search || undefined });
  const cloneable = (listQuery.data?.data ?? []).filter((row) =>
    row.available_actions.includes("clone"),
  );

  async function onSubmit() {
    if (!pickedId) {
      toast.error("Select a sales order.");
      return;
    }
    try {
      const cloned = await cloneSalesOrder.mutateAsync(pickedId);
      toast.success("Sales order cloned");
      onOpenChange(false);
      router.push(`/sales-orders/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Clone sales order</DialogTitle>
        <DialogDescription>
          Copies the order as a new draft. It does not consume remaining quantity on the source
          order.
        </DialogDescription>
      </DialogHeader>
      <ConversionSourceSelect
        label="Sales order"
        value={pickedId}
        onValueChange={setPickedId}
        onSearch={setSearch}
        loading={listQuery.isFetching}
        placeholder="Select a sales order"
        options={cloneable.map((row) => ({
          value: row.id,
          label: `${salesOrderDisplayNumber(row) ?? "Sales order"} · ${formatDate(row.order_date)}`,
        }))}
        emptyText="No sales orders are available to clone."
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={cloneSalesOrder.isPending || !pickedId}
          onClick={() => void onSubmit()}
        >
          {cloneSalesOrder.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Clone
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
