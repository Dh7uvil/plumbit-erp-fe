"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useCreateGoodsReceiptFromPurchaseInvoice } from "@/modules/inventory-management/goods-receipts/mutations";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { getErrorMessage } from "@/shared/api/errors";
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
import { Textarea } from "@/shared/components/ui/textarea";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

export function CreateGoodsReceiptFromPurchaseInvoiceDialog({
  purchaseInvoiceId,
  open,
  onOpenChange,
}: {
  purchaseInvoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const create = useCreateGoodsReceiptFromPurchaseInvoice();
  const warehousesQuery = useAllWarehouses();
  const warehouses = warehousesQuery.data ?? [];
  const [warehouseId, setWarehouseId] = useState(OPTIONAL_SELECT_NONE);
  const [documentDate, setDocumentDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setWarehouseId(OPTIONAL_SELECT_NONE);
      setDocumentDate(todayIsoDate());
      setNotes("");
    }
  }, [open]);

  async function onSubmit() {
    try {
      const receipt = await create.mutateAsync({
        purchase_invoice_id: purchaseInvoiceId,
        warehouse_id: optionalUuid(warehouseId),
        document_date: documentDate || null,
        notes: notes.trim() || null,
      });
      toast.success("Goods receipt created");
      onOpenChange(false);
      router.push(`/goods-receipts/${receipt.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
        <DialogHeader>
          <DialogTitle>Create goods receipt</DialogTitle>
          <DialogDescription>
            Create a goods receipt for the remaining quantity on this posted purchase invoice. Stock
            moves when the receipt is posted.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grn-from-pi-date">Document date</Label>
            <Input
              id="grn-from-pi-date"
              type="date"
              value={documentDate}
              onChange={(event) => setDocumentDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Warehouse</Label>
            <MasterSelect
              value={warehouseId}
              onValueChange={setWarehouseId}
              disabled={warehousesQuery.isLoading}
              placeholder="Default warehouse if blank"
              searchPlaceholder="Search warehouses…"
              options={[
                { value: OPTIONAL_SELECT_NONE, label: "Use default warehouse" },
                ...warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                })),
              ]}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grn-from-pi-notes">Notes</Label>
            <Textarea
              id="grn-from-pi-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={create.isPending} onClick={onSubmit}>
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create goods receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
