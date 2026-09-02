"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  useAcceptQuotation,
  useApproveQuotation,
  useCancelQuotation,
  useCloneQuotation,
  useDeclineQuotation,
  useDeleteQuotation,
  useRejectQuotation,
  useReopenQuotation,
  useSendQuotation,
  useSubmitQuotation,
} from "@/modules/erp/quotations/mutations";
import { quotationDisplayNumber, type Quotation } from "@/modules/erp/quotations/schemas";
import {
  isIrreversibleQuotationAction,
  quotationActionEffect,
  QUOTATION_ACTION_LABELS,
  visibleQuotationActions,
  type QuotationWorkflowAction,
} from "@/modules/erp/quotations/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCan } from "@/shared/providers/session-provider";

const DESTRUCTIVE_ACTIONS = new Set<QuotationWorkflowAction>([
  "reject",
  "decline",
  "cancel",
  "delete",
]);

export function QuotationWorkflowButtons({ quotation }: { quotation: Quotation }) {
  const can = useCan();
  const router = useRouter();
  const submitQuotation = useSubmitQuotation();
  const approveQuotation = useApproveQuotation();
  const rejectQuotation = useRejectQuotation();
  const reopenQuotation = useReopenQuotation();
  const sendQuotation = useSendQuotation();
  const acceptQuotation = useAcceptQuotation();
  const declineQuotation = useDeclineQuotation();
  const cancelQuotation = useCancelQuotation();
  const cloneQuotation = useCloneQuotation();
  const deleteQuotation = useDeleteQuotation();
  const [confirming, setConfirming] = useState<QuotationWorkflowAction | null>(null);
  const [running, setRunning] = useState<QuotationWorkflowAction | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const actions = visibleQuotationActions(quotation.available_actions, can);
  const label = quotationDisplayNumber(quotation) ?? "quotation";
  const pending = Boolean(running);
  const write = { id: quotation.id, version: quotation.version };

  async function runAction(action: QuotationWorkflowAction) {
    setRunning(action);
    try {
      if (action === "submit") {
        await submitQuotation.mutateAsync(write);
        toast.success("Quotation submitted");
      } else if (action === "approve") {
        await approveQuotation.mutateAsync(write);
        toast.success("Quotation approved");
      } else if (action === "reject") {
        await rejectQuotation.mutateAsync({
          ...write,
          reason: rejectReason.trim() ? rejectReason.trim() : null,
        });
        toast.success("Quotation rejected");
      } else if (action === "reopen") {
        await reopenQuotation.mutateAsync(write);
        toast.success("Quotation reopened");
      } else if (action === "send") {
        await sendQuotation.mutateAsync(write);
        toast.success("Quotation sent");
      } else if (action === "accept") {
        await acceptQuotation.mutateAsync(write);
        toast.success("Quotation accepted");
      } else if (action === "decline") {
        await declineQuotation.mutateAsync(write);
        toast.success("Quotation declined");
      } else if (action === "cancel") {
        await cancelQuotation.mutateAsync(write);
        toast.success("Quotation cancelled");
      } else if (action === "clone") {
        const cloned = await cloneQuotation.mutateAsync(quotation.id);
        toast.success("Quotation cloned");
        router.push(`/quotations/${cloned.id}`);
      } else if (action === "delete") {
        await deleteQuotation.mutateAsync(write);
        toast.success("Quotation deleted");
        router.push("/quotations");
      }
      setConfirming(null);
      setRejectReason("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRunning(null);
    }
  }

  function onAction(action: QuotationWorkflowAction) {
    if (isIrreversibleQuotationAction(action)) {
      setConfirming(action);
      return;
    }
    void runAction(action);
  }

  const confirmLabel = confirming ? QUOTATION_ACTION_LABELS[confirming] : "Confirm";
  const confirmTitle = confirming
    ? `${QUOTATION_ACTION_LABELS[confirming]} quotation ${label}`
    : "";

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
            {QUOTATION_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
      <ConfirmActionDialog
        open={Boolean(confirming)}
        title={confirmTitle}
        description={confirming ? quotationActionEffect(confirming, label) : ""}
        extra={
          confirming === "reject" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quotation-reject-reason">Reason (optional)</Label>
              <Textarea
                id="quotation-reject-reason"
                value={rejectReason}
                maxLength={2000}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Why this quotation is being rejected"
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
            setRejectReason("");
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
