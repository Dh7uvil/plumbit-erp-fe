"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCancelStockTransfer,
  useCloneStockTransfer,
  useDeleteStockTransfer,
  usePostStockTransfer,
} from "@/modules/inventory-management/stock-transfers/mutations";
import {
  stockTransferDisplayNumber,
  type StockTransfer,
} from "@/modules/inventory-management/stock-transfers/schemas";
import {
  isIrreversibleStockTransferAction,
  stockTransferActionEffect,
  STOCK_TRANSFER_ACTION_LABELS,
  visibleStockTransferActions,
  type StockTransferWorkflowAction,
} from "@/modules/inventory-management/stock-transfers/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCan } from "@/shared/providers/session-provider";

const DESTRUCTIVE_ACTIONS = new Set<StockTransferWorkflowAction>(["cancel", "delete"]);

export function StockTransferWorkflowButtons({ transfer }: { transfer: StockTransfer }) {
  const can = useCan();
  const router = useRouter();
  const postTransfer = usePostStockTransfer();
  const cancelTransfer = useCancelStockTransfer();
  const cloneTransfer = useCloneStockTransfer();
  const deleteTransfer = useDeleteStockTransfer();
  const [confirming, setConfirming] = useState<StockTransferWorkflowAction | null>(null);
  const [running, setRunning] = useState<StockTransferWorkflowAction | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const actions = visibleStockTransferActions(transfer.available_actions, can);
  const label = stockTransferDisplayNumber(transfer) ?? "transfer";
  const pending = Boolean(running);
  const write = { id: transfer.id, version: transfer.version };

  async function runAction(action: StockTransferWorkflowAction) {
    setRunning(action);
    try {
      if (action === "post") {
        await postTransfer.mutateAsync(write);
        toast.success("Stock transfer posted");
      } else if (action === "cancel") {
        await cancelTransfer.mutateAsync({
          ...write,
          reason: cancelReason.trim() ? cancelReason.trim() : null,
        });
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
      setConfirming(null);
      setCancelReason("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRunning(null);
    }
  }

  function onAction(action: StockTransferWorkflowAction) {
    if (isIrreversibleStockTransferAction(action)) {
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
            {STOCK_TRANSFER_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
      <ConfirmActionDialog
        open={Boolean(confirming)}
        title={
          confirming ? `${STOCK_TRANSFER_ACTION_LABELS[confirming]} stock transfer ${label}` : ""
        }
        description={confirming ? stockTransferActionEffect(confirming, label) : ""}
        extra={
          confirming === "cancel" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-transfer-cancel-reason">Reason (optional)</Label>
              <Textarea
                id="stock-transfer-cancel-reason"
                value={cancelReason}
                maxLength={2000}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Why this transfer is being cancelled"
              />
            </div>
          ) : null
        }
        confirmLabel={confirming ? STOCK_TRANSFER_ACTION_LABELS[confirming] : "Confirm"}
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
