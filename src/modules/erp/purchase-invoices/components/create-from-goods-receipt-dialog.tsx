"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreatePurchaseInvoiceFromGoodsReceipt } from "@/modules/erp/purchase-invoices/mutations";
import { useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import { goodsReceiptDisplayNumber } from "@/modules/inventory-management/goods-receipts/schemas";
import { getErrorMessage } from "@/shared/api/errors";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
  const router = useRouter();
  const createBill = useCreatePurchaseInvoiceFromGoodsReceipt();
  const receiptsQuery = useGoodsReceipts({ status: "POSTED", page_size: 100 }, open);
  const receipts = receiptsQuery.data?.data ?? [];
  const [selectedId, setSelectedId] = useState(goodsReceiptId ?? "");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create bill from goods receipt</DialogTitle>
          <DialogDescription>
            Creates a draft goods bill against the posted receipt. Stock will not move.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {!goodsReceiptId ? (
            <div className="flex flex-col gap-1.5">
              <Label>Goods receipt</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a goods receipt" />
                </SelectTrigger>
                <SelectContent>
                  {receipts.map((receipt) => (
                    <SelectItem key={receipt.id} value={receipt.id}>
                      {goodsReceiptDisplayNumber(receipt) ?? "Goods receipt"} ·{" "}
                      {formatDate(receipt.document_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
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
    </Dialog>
  );
}
