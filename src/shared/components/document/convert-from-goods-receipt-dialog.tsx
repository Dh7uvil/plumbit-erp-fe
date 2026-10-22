"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import { goodsReceiptDisplayNumber } from "@/modules/inventory-management/goods-receipts/schemas";
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

type ConvertFromGoodsReceiptTarget = "purchase-returns" | "quality-inspections";

const TARGET_COPY: Record<
  ConvertFromGoodsReceiptTarget,
  { title: string; description: string; continueLabel: string }
> = {
  "purchase-returns": {
    title: "Create purchase return from goods receipt",
    description: "Opens a new purchase return prefilled from a posted goods receipt.",
    continueLabel: "Continue",
  },
  "quality-inspections": {
    title: "Create inspection from goods receipt",
    description: "Opens a new quality inspection for a posted goods receipt on hold.",
    continueLabel: "Continue",
  },
};

export function ConvertFromGoodsReceiptDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ConvertFromGoodsReceiptTarget;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ConvertFromGoodsReceiptBody target={target} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function ConvertFromGoodsReceiptBody({
  target,
  onOpenChange,
}: {
  target: ConvertFromGoodsReceiptTarget;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const copy = TARGET_COPY[target];
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const receiptsQuery = useGoodsReceipts({
    status: "POSTED",
    page_size: 50,
    search: search || undefined,
  });
  const receipts = receiptsQuery.data?.data ?? [];

  function onContinue() {
    if (!selectedId) {
      toast.error("Select a goods receipt.");
      return;
    }
    onOpenChange(false);
    router.push(`/${target}/new?goods_receipt_id=${selectedId}`);
  }

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
      </DialogHeader>
      <ConversionSourceSelect
        label="Goods receipt"
        value={selectedId}
        onValueChange={setSelectedId}
        onSearch={setSearch}
        loading={receiptsQuery.isFetching}
        placeholder="Select a goods receipt"
        options={receipts.map((row) => ({
          value: row.id,
          label: `${goodsReceiptDisplayNumber(row) ?? "Goods receipt"} · ${formatDate(row.document_date)}`,
        }))}
        emptyText="No posted goods receipts are available."
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={!selectedId} onClick={onContinue}>
          {copy.continueLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
