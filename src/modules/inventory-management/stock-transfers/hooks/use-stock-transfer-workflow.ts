"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelStockTransfer,
  useCloneStockTransfer,
  useDeleteStockTransfer,
  usePostStockTransfer,
} from "@/modules/inventory-management/stock-transfers/mutations";
import type { StockTransfer } from "@/modules/inventory-management/stock-transfers/schemas";
import type { StockTransferWorkflowAction } from "@/modules/inventory-management/stock-transfers/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useStockTransferWorkflow(transfer: StockTransfer) {
  const router = useRouter();
  const postTransfer = usePostStockTransfer();
  const cancelTransfer = useCancelStockTransfer();
  const cloneTransfer = useCloneStockTransfer();
  const deleteTransfer = useDeleteStockTransfer();
  const write = { id: transfer.id, version: transfer.version };

  return async function onAction(
    action: StockTransferWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postTransfer.mutateAsync(write);
      toast.success("Stock transfer posted");
    } else if (action === "cancel") {
      await cancelTransfer.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Stock transfer cancelled");
    } else if (action === "clone") {
      const cloned = await cloneTransfer.mutateAsync(transfer.id);
      toast.success("Stock transfer cloned");
      router.push(`/stock-transfers/${cloned.id}`);
    } else if (action === "delete") {
      await deleteTransfer.mutateAsync(write);
      toast.success("Stock transfer deleted");
      router.push("/stock-transfers");
    }
  };
}
