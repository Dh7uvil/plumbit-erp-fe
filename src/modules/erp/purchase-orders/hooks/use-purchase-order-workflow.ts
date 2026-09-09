"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useApprovePurchaseOrder,
  useCancelPurchaseOrder,
  useClonePurchaseOrder,
  useClosePurchaseOrder,
  useIssuePurchaseOrder,
  useDeletePurchaseOrder,
  useRejectPurchaseOrder,
  useReopenPurchaseOrder,
  useSubmitPurchaseOrder,
} from "@/modules/erp/purchase-orders/mutations";
import type { PurchaseOrder } from "@/modules/erp/purchase-orders/schemas";
import type { PurchaseOrderWorkflowAction } from "@/modules/erp/purchase-orders/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function usePurchaseOrderWorkflow(purchaseOrder: PurchaseOrder) {
  const router = useRouter();
  const submitPurchaseOrder = useSubmitPurchaseOrder();
  const approvePurchaseOrder = useApprovePurchaseOrder();
  const rejectPurchaseOrder = useRejectPurchaseOrder();
  const reopenPurchaseOrder = useReopenPurchaseOrder();
  const issuePurchaseOrder = useIssuePurchaseOrder();
  const closePurchaseOrder = useClosePurchaseOrder();
  const cancelPurchaseOrder = useCancelPurchaseOrder();
  const clonePurchaseOrder = useClonePurchaseOrder();
  const deletePurchaseOrder = useDeletePurchaseOrder();
  const write = { id: purchaseOrder.id, version: purchaseOrder.version };

  return async function onAction(
    action: PurchaseOrderWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "submit") {
      await submitPurchaseOrder.mutateAsync(write);
      toast.success("Purchase order submitted");
    } else if (action === "approve") {
      await approvePurchaseOrder.mutateAsync(write);
      toast.success("Purchase order approved");
    } else if (action === "reject") {
      await rejectPurchaseOrder.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Purchase order rejected");
    } else if (action === "reopen") {
      await reopenPurchaseOrder.mutateAsync(write);
      toast.success("Purchase order reopened");
    } else if (action === "issue") {
      await issuePurchaseOrder.mutateAsync(write);
      toast.success("Purchase order issued");
    } else if (action === "close") {
      await closePurchaseOrder.mutateAsync(write);
      toast.success("Purchase order closed");
    } else if (action === "cancel") {
      await cancelPurchaseOrder.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Purchase order cancelled");
    } else if (action === "clone") {
      const cloned = await clonePurchaseOrder.mutateAsync(purchaseOrder.id);
      toast.success("Purchase order cloned");
      router.push(`/purchase-orders/${cloned.id}`);
    } else if (action === "delete") {
      await deletePurchaseOrder.mutateAsync(write);
      toast.success("Purchase order deleted");
      router.push("/purchase-orders");
    }
  };
}
