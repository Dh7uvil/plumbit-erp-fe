"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import {
  purchaseOrderDisplayNumber,
  type PurchaseOrder,
} from "@/modules/erp/purchase-orders/schemas";
import {
  isIrreversiblePurchaseOrderAction,
  purchaseOrderActionEffect,
  PURCHASE_ORDER_ACTION_LABELS,
  visiblePurchaseOrderActions,
  type PurchaseOrderWorkflowAction,
} from "@/modules/erp/purchase-orders/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCan } from "@/shared/providers/session-provider";

const DESTRUCTIVE_ACTIONS = new Set<PurchaseOrderWorkflowAction>(["reject", "cancel", "delete"]);

export function PurchaseOrderWorkflowButtons({ purchaseOrder }: { purchaseOrder: PurchaseOrder }) {
  const can = useCan();
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
  const [confirming, setConfirming] = useState<PurchaseOrderWorkflowAction | null>(null);
  const [running, setRunning] = useState<PurchaseOrderWorkflowAction | null>(null);
  const [reason, setReason] = useState("");

  const actions = visiblePurchaseOrderActions(purchaseOrder.available_actions, can);
  const label = purchaseOrderDisplayNumber(purchaseOrder) ?? "purchase order";
  const pending = Boolean(running);
  const write = { id: purchaseOrder.id, version: purchaseOrder.version };

  async function runAction(action: PurchaseOrderWorkflowAction) {
    setRunning(action);
    try {
      if (action === "submit") {
        await submitPurchaseOrder.mutateAsync(write);
        toast.success("Purchase order submitted");
      } else if (action === "approve") {
        await approvePurchaseOrder.mutateAsync(write);
        toast.success("Purchase order approved");
      } else if (action === "reject") {
        await rejectPurchaseOrder.mutateAsync({
          ...write,
          reason: reason.trim() ? reason.trim() : null,
        });
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
        await cancelPurchaseOrder.mutateAsync({
          ...write,
          reason: reason.trim() ? reason.trim() : null,
        });
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
      setConfirming(null);
      setReason("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRunning(null);
    }
  }

  function onAction(action: PurchaseOrderWorkflowAction) {
    if (isIrreversiblePurchaseOrderAction(action)) {
      setConfirming(action);
      return;
    }
    void runAction(action);
  }

  const confirmLabel = confirming ? PURCHASE_ORDER_ACTION_LABELS[confirming] : "Confirm";
  const confirmTitle = confirming
    ? `${PURCHASE_ORDER_ACTION_LABELS[confirming]} purchase order ${label}`
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
            {PURCHASE_ORDER_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
      <ConfirmActionDialog
        open={Boolean(confirming)}
        title={confirmTitle}
        description={confirming ? purchaseOrderActionEffect(confirming, label) : ""}
        extra={
          showReason ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="purchase-order-action-reason">Reason (optional)</Label>
              <Textarea
                id="purchase-order-action-reason"
                value={reason}
                maxLength={2000}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  confirming === "cancel"
                    ? "Why this purchase order is being cancelled"
                    : "Why this purchase order is being rejected"
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
