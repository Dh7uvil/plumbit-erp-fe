"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  useApproveSalesOrder,
  useCancelSalesOrder,
  useCloneSalesOrder,
  useCloseSalesOrder,
  useConfirmSalesOrder,
  useDeleteSalesOrder,
  useRejectSalesOrder,
  useReopenSalesOrder,
  useSubmitSalesOrder,
} from "@/modules/erp/sales-orders/mutations";
import { salesOrderDisplayNumber, type SalesOrder } from "@/modules/erp/sales-orders/schemas";
import {
  isIrreversibleSalesOrderAction,
  salesOrderActionEffect,
  SALES_ORDER_ACTION_LABELS,
  visibleSalesOrderActions,
  type SalesOrderWorkflowAction,
} from "@/modules/erp/sales-orders/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCan } from "@/shared/providers/session-provider";

const DESTRUCTIVE_ACTIONS = new Set<SalesOrderWorkflowAction>(["reject", "cancel", "delete"]);

export function SalesOrderWorkflowButtons({ salesOrder }: { salesOrder: SalesOrder }) {
  const can = useCan();
  const router = useRouter();
  const submitSalesOrder = useSubmitSalesOrder();
  const approveSalesOrder = useApproveSalesOrder();
  const rejectSalesOrder = useRejectSalesOrder();
  const reopenSalesOrder = useReopenSalesOrder();
  const confirmSalesOrder = useConfirmSalesOrder();
  const closeSalesOrder = useCloseSalesOrder();
  const cancelSalesOrder = useCancelSalesOrder();
  const cloneSalesOrder = useCloneSalesOrder();
  const deleteSalesOrder = useDeleteSalesOrder();
  const [confirming, setConfirming] = useState<SalesOrderWorkflowAction | null>(null);
  const [running, setRunning] = useState<SalesOrderWorkflowAction | null>(null);
  const [reason, setReason] = useState("");

  const actions = visibleSalesOrderActions(salesOrder.available_actions, can);
  const label = salesOrderDisplayNumber(salesOrder) ?? "sales order";
  const pending = Boolean(running);
  const write = { id: salesOrder.id, version: salesOrder.version };

  async function runAction(action: SalesOrderWorkflowAction) {
    setRunning(action);
    try {
      if (action === "submit") {
        await submitSalesOrder.mutateAsync(write);
        toast.success("Sales order submitted");
      } else if (action === "approve") {
        await approveSalesOrder.mutateAsync(write);
        toast.success("Sales order approved");
      } else if (action === "reject") {
        await rejectSalesOrder.mutateAsync({
          ...write,
          reason: reason.trim() ? reason.trim() : null,
        });
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
      } else if (action === "cancel") {
        await cancelSalesOrder.mutateAsync({
          ...write,
          reason: reason.trim() ? reason.trim() : null,
        });
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
      setConfirming(null);
      setReason("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRunning(null);
    }
  }

  function onAction(action: SalesOrderWorkflowAction) {
    if (isIrreversibleSalesOrderAction(action)) {
      setConfirming(action);
      return;
    }
    void runAction(action);
  }

  const confirmLabel = confirming ? SALES_ORDER_ACTION_LABELS[confirming] : "Confirm";
  const confirmTitle = confirming
    ? `${SALES_ORDER_ACTION_LABELS[confirming]} sales order ${label}`
    : "";
  const showReason = confirming === "reject" || confirming === "cancel";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant={
              action === "clone"
                ? "outline"
                : DESTRUCTIVE_ACTIONS.has(action)
                  ? "destructive"
                  : "default"
            }
            disabled={pending}
            onClick={() => onAction(action)}
          >
            {running === action ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {SALES_ORDER_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
      <ConfirmActionDialog
        open={Boolean(confirming)}
        title={confirmTitle}
        description={confirming ? salesOrderActionEffect(confirming, label) : ""}
        extra={
          showReason ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sales-order-action-reason">Reason (optional)</Label>
              <Textarea
                id="sales-order-action-reason"
                value={reason}
                maxLength={2000}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  confirming === "cancel"
                    ? "Why this sales order is being cancelled"
                    : "Why this sales order is being rejected"
                }
              />
            </div>
          ) : null
        }
        confirmLabel={confirmLabel}
        pending={pending}
        variant={confirming && DESTRUCTIVE_ACTIONS.has(confirming) ? "destructive" : "default"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
            setReason("");
          }
        }}
        onConfirm={() => {
          if (confirming) {
            void runAction(confirming);
          }
        }}
      />
    </>
  );
}
