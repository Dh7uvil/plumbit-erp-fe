"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreatePurchaseInvoiceFromGoodsReceipt } from "@/modules/erp/purchase-invoices/mutations";
import { useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import { goodsReceiptDisplayNumber } from "@/modules/inventory-management/goods-receipts/schemas";
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

export function CreateBillFromGoodsReceiptDialog({
  open,
  onOpenChange,
  goodsReceiptId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goodsReceiptId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateBillFromGoodsReceiptBody
          goodsReceiptId={goodsReceiptId}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function CreateBillFromGoodsReceiptBody({
  goodsReceiptId,
  onOpenChange,
}: {
  goodsReceiptId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createBill = useCreatePurchaseInvoiceFromGoodsReceipt();
  const [selectedId, setSelectedId] = useState(goodsReceiptId ?? "");
  const [search, setSearch] = useState("");
  const receiptsQuery = useGoodsReceipts(
    { status: "POSTED", page_size: 50, search: search || undefined },
    !goodsReceiptId,
  );
  const receipts = receiptsQuery.data?.data ?? [];
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const chosenId = goodsReceiptId ?? selectedId;

  async function onSubmit() {
    if (!chosenId) {
      toast.error("Select a goods receipt.");
      return;
    }
    try {
      const invoice = await createBill.mutateAsync({
        goods_receipt_id: chosenId,
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
        <DialogTitle>Create bill from goods receipt</DialogTitle>
        <DialogDescription>
          Creates a draft goods bill against the posted receipt. Stock will not move.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        {goodsReceiptId ? null : (
          <ConversionSourceSelect
            label="Goods receipt"
            value={selectedId}
            onValueChange={setSelectedId}
            onSearch={setSearch}
            loading={receiptsQuery.isFetching}
            placeholder="Select a goods receipt"
            options={receipts.map((receipt) => ({
              value: receipt.id,
              label: `${goodsReceiptDisplayNumber(receipt) ?? "Goods receipt"} · ${formatDate(receipt.document_date)}`,
            }))}
            emptyText="No posted goods receipts are available."
          />
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-from-grn-date">Invoice date</Label>
          <Input
            id="pi-from-grn-date"
            type="date"
            value={invoiceDate}
            onChange={(event) => setInvoiceDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-from-grn-notes">Notes</Label>
          <Textarea
            id="pi-from-grn-notes"
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
