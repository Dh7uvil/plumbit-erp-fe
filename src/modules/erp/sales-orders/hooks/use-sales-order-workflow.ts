"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useApproveSalesOrder,
  useCancelSalesOrder,
  useCloneSalesOrder,
  useCloseSalesOrder,
  useConfirmSalesOrder,
  useDeleteSalesOrder,
  useAcknowledgeSalesOrder,
  useRejectSalesOrder,
  useReopenSalesOrder,
  useSubmitSalesOrder,
} from "@/modules/erp/sales-orders/mutations";
import type { SalesOrder } from "@/modules/erp/sales-orders/schemas";
import type { SalesOrderWorkflowAction } from "@/modules/erp/sales-orders/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useSalesOrderWorkflow(salesOrder: SalesOrder) {
  const router = useRouter();
  const submitSalesOrder = useSubmitSalesOrder();
  const approveSalesOrder = useApproveSalesOrder();
  const rejectSalesOrder = useRejectSalesOrder();
  const reopenSalesOrder = useReopenSalesOrder();
  const confirmSalesOrder = useConfirmSalesOrder();
  const closeSalesOrder = useCloseSalesOrder();
  const acknowledgeSalesOrder = useAcknowledgeSalesOrder();
  const cancelSalesOrder = useCancelSalesOrder();
  const cloneSalesOrder = useCloneSalesOrder();
  const deleteSalesOrder = useDeleteSalesOrder();
  const write = { id: salesOrder.id, version: salesOrder.version };

  return async function onAction(action: SalesOrderWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "submit") {
      await submitSalesOrder.mutateAsync(write);
      toast.success("Sales order submitted");
    } else if (action === "approve") {
      await approveSalesOrder.mutateAsync(write);
      toast.success("Sales order approved");
    } else if (action === "reject") {
      await rejectSalesOrder.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Sales order rejected");
    } else if (action === "reopen") {
      await reopenSalesOrder.mutateAsync(write);
      toast.success("Sales order reopened");
    } else if (action === "confirm") {
      await confirmSalesOrder.mutateAsync(write);
      toast.success("Sales order confirmed");
    } else if (action === "close") {
      await closeSalesOrder.mutateAsync(write);
      toast.success("Sales order closed");
    } else if (action === "acknowledge") {
      await acknowledgeSalesOrder.mutateAsync(write);
      toast.success("Sales order acknowledged");
    } else if (action === "cancel") {
      await cancelSalesOrder.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Sales order cancelled");
    } else if (action === "clone") {
      const cloned = await cloneSalesOrder.mutateAsync(salesOrder.id);
      toast.success("Sales order cloned");
      router.push(`/sales-orders/${cloned.id}`);
    } else if (action === "delete") {
      await deleteSalesOrder.mutateAsync(write);
      toast.success("Sales order deleted");
      router.push("/sales-orders");
    }
  };
}
