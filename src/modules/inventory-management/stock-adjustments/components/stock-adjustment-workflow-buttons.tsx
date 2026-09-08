"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCancelStockAdjustment,
  useCloneStockAdjustment,
  useDeleteStockAdjustment,
  usePostStockAdjustment,
} from "@/modules/inventory-management/stock-adjustments/mutations";
import {
  stockAdjustmentDisplayNumber,
  type StockAdjustment,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import {
  isIrreversibleStockAdjustmentAction,
  stockAdjustmentActionEffect,
  STOCK_ADJUSTMENT_ACTION_LABELS,
  visibleStockAdjustmentActions,
  type StockAdjustmentWorkflowAction,
} from "@/modules/inventory-management/stock-adjustments/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCan } from "@/shared/providers/session-provider";

const DESTRUCTIVE_ACTIONS = new Set<StockAdjustmentWorkflowAction>(["cancel", "delete"]);

export function StockAdjustmentWorkflowButtons({ adjustment }: { adjustment: StockAdjustment }) {
  const can = useCan();
  const router = useRouter();
  const postAdjustment = usePostStockAdjustment();
  const cancelAdjustment = useCancelStockAdjustment();
  const cloneAdjustment = useCloneStockAdjustment();
  const deleteAdjustment = useDeleteStockAdjustment();
  const [confirming, setConfirming] = useState<StockAdjustmentWorkflowAction | null>(null);
  const [running, setRunning] = useState<StockAdjustmentWorkflowAction | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const actions = visibleStockAdjustmentActions(adjustment.available_actions, can);
  const label = stockAdjustmentDisplayNumber(adjustment) ?? "adjustment";
  const pending = Boolean(running);
  const write = { id: adjustment.id, version: adjustment.version };

  async function runAction(action: StockAdjustmentWorkflowAction) {
    setRunning(action);
    try {
      if (action === "post") {
        await postAdjustment.mutateAsync(write);
        toast.success("Stock adjustment posted");
      } else if (action === "cancel") {
        await cancelAdjustment.mutateAsync({
          ...write,
          reason: cancelReason.trim() ? cancelReason.trim() : null,
        });
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
      setConfirming(null);
      setCancelReason("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRunning(null);
    }
  }

  function onAction(action: StockAdjustmentWorkflowAction) {
    if (isIrreversibleStockAdjustmentAction(action)) {
      setConfirming(action);
      return;
    }
    void runAction(action);
  }

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
            {STOCK_ADJUSTMENT_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
      <ConfirmActionDialog
        open={Boolean(confirming)}
        title={
          confirming
            ? `${STOCK_ADJUSTMENT_ACTION_LABELS[confirming]} stock adjustment ${label}`
            : ""
        }
        description={confirming ? stockAdjustmentActionEffect(confirming, label) : ""}
        extra={
          confirming === "cancel" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-adjustment-cancel-reason">Reason (optional)</Label>
              <Textarea
                id="stock-adjustment-cancel-reason"
                value={cancelReason}
                maxLength={2000}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Why this adjustment is being cancelled"
              />
            </div>
          ) : null
        }
        confirmLabel={confirming ? STOCK_ADJUSTMENT_ACTION_LABELS[confirming] : "Confirm"}
        pending={pending}
        variant={confirming && DESTRUCTIVE_ACTIONS.has(confirming) ? "destructive" : "default"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
            setCancelReason("");
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
