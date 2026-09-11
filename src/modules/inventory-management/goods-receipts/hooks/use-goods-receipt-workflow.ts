"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelGoodsReceipt,
  useDeleteGoodsReceipt,
  usePostGoodsReceipt,
} from "@/modules/inventory-management/goods-receipts/mutations";
import {
  qtyIsPositive,
  type GoodsReceipt,
} from "@/modules/inventory-management/goods-receipts/schemas";
import type { GoodsReceiptWorkflowAction } from "@/modules/inventory-management/goods-receipts/workflow";
import { useCreateQualityInspection } from "@/modules/inventory-management/quality-inspections/mutations";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useGoodsReceiptWorkflow(receipt: GoodsReceipt) {
  const router = useRouter();
  const postReceipt = usePostGoodsReceipt();
  const cancelReceipt = useCancelGoodsReceipt();
  const deleteReceipt = useDeleteGoodsReceipt();
  const createInspection = useCreateQualityInspection();
  const write = { id: receipt.id, version: receipt.version };

  return async function onAction(action: GoodsReceiptWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "post") {
      await postReceipt.mutateAsync(write);
      toast.success("Goods receipt posted");
    } else if (action === "cancel") {
      await cancelReceipt.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Goods receipt cancelled");
    } else if (action === "delete") {
      await deleteReceipt.mutateAsync(write);
      toast.success("Goods receipt deleted");
      router.push("/goods-receipts");
    } else if (action === "create_inspection") {
      const holdLines = receipt.lines.filter((line) => qtyIsPositive(line.qty_on_hold));
      if (holdLines.length === 0) {
        toast.error("No quantity remains on quality hold.");
        return;
      }
      const inspection = await createInspection.mutateAsync({
        goods_receipt_id: receipt.id,
        lines: holdLines.map((line) => ({
          goods_receipt_line_id: line.id,
          qty_inspected: line.qty_on_hold,
          qty_accepted: line.qty_on_hold,
          qty_rejected: "0",
          qty_rework: "0",
        })),
      });
      toast.success("Quality inspection created");
      router.push(`/quality-inspections/${inspection.id}`);
    } else if (action === "create_purchase_return") {
      router.push(`/purchase-returns/new?goods_receipt_id=${receipt.id}`);
    }
  };
}
