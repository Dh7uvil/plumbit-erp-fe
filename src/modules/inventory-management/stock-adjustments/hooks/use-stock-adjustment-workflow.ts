"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelStockAdjustment,
  useCloneStockAdjustment,
  useDeleteStockAdjustment,
  usePostStockAdjustment,
} from "@/modules/inventory-management/stock-adjustments/mutations";
import type { StockAdjustment } from "@/modules/inventory-management/stock-adjustments/schemas";
import type { StockAdjustmentWorkflowAction } from "@/modules/inventory-management/stock-adjustments/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useStockAdjustmentWorkflow(adjustment: StockAdjustment) {
  const router = useRouter();
  const postAdjustment = usePostStockAdjustment();
  const cancelAdjustment = useCancelStockAdjustment();
  const cloneAdjustment = useCloneStockAdjustment();
  const deleteAdjustment = useDeleteStockAdjustment();
  const write = { id: adjustment.id, version: adjustment.version };

  return async function onAction(
    action: StockAdjustmentWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postAdjustment.mutateAsync(write);
      toast.success("Stock adjustment posted");
    } else if (action === "cancel") {
      await cancelAdjustment.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Stock adjustment cancelled");
    } else if (action === "clone") {
      const cloned = await cloneAdjustment.mutateAsync(adjustment.id);
      toast.success("Stock adjustment cloned");
      router.push(`/stock-adjustments/${cloned.id}`);
    } else if (action === "delete") {
      await deleteAdjustment.mutateAsync(write);
      toast.success("Stock adjustment deleted");
      router.push("/stock-adjustments");
    }
  };
}
