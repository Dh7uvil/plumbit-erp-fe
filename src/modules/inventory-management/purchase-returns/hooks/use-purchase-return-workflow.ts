"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelPurchaseReturn,
  useDeletePurchaseReturn,
  usePostPurchaseReturn,
} from "@/modules/inventory-management/purchase-returns/mutations";
import type { PurchaseReturn } from "@/modules/inventory-management/purchase-returns/schemas";
import type { PurchaseReturnWorkflowAction } from "@/modules/inventory-management/purchase-returns/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function usePurchaseReturnWorkflow(doc: PurchaseReturn) {
  const router = useRouter();
  const postReturn = usePostPurchaseReturn();
  const cancelReturn = useCancelPurchaseReturn();
  const deleteReturn = useDeletePurchaseReturn();
  const write = { id: doc.id, version: doc.version };

  return async function onAction(
    action: PurchaseReturnWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postReturn.mutateAsync(write);
      toast.success("Purchase return posted");
    } else if (action === "cancel") {
      await cancelReturn.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Purchase return cancelled");
    } else if (action === "delete") {
      await deleteReturn.mutateAsync(write);
      toast.success("Purchase return deleted");
      router.push("/purchase-returns");
    }
  };
}
