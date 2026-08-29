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
  useRejectQuotation,
  useReopenQuotation,
  useSendQuotation,
  useSubmitQuotation,
} from "@/modules/erp/quotations/mutations";
import { quotationDisplayNumber, type Quotation } from "@/modules/erp/quotations/schemas";
import {
  isIrreversibleQuotationAction,
  QUOTATION_ACTION_LABELS,
  visibleQuotationActions,
  type QuotationWorkflowAction,
} from "@/modules/erp/quotations/workflow";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { useCan } from "@/shared/providers/session-provider";

const DESTRUCTIVE_ACTIONS = new Set<QuotationWorkflowAction>(["reject", "decline", "cancel"]);

export function QuotationWorkflowButtons({ quotation }: { quotation: Quotation }) {
  const can = useCan();
  const router = useRouter();
  const tenantQuery = useCurrentTenant();
  const submitQuotation = useSubmitQuotation();
  const approveQuotation = useApproveQuotation();
  const rejectQuotation = useRejectQuotation();
  const reopenQuotation = useReopenQuotation();
  const sendQuotation = useSendQuotation();
  const acceptQuotation = useAcceptQuotation();
  const declineQuotation = useDeclineQuotation();
  const cancelQuotation = useCancelQuotation();
  const cloneQuotation = useCloneQuotation();
  const [confirming, setConfirming] = useState<QuotationWorkflowAction | null>(null);
  const [running, setRunning] = useState<QuotationWorkflowAction | null>(null);

  const requiresApproval = tenantQuery.data?.quotation_requires_approval ?? true;
  const actions = visibleQuotationActions(quotation.status, { can, requiresApproval });
  const label = quotationDisplayNumber(quotation) ?? "quotation";
  const pending = Boolean(running);

  async function runAction(action: QuotationWorkflowAction) {
    setRunning(action);
    try {
      if (action === "submit") {
        await submitQuotation.mutateAsync(quotation.id);
        toast.success("Quotation submitted");
      } else if (action === "approve") {
        await approveQuotation.mutateAsync(quotation.id);
        toast.success("Quotation approved");
      } else if (action === "reject") {
        await rejectQuotation.mutateAsync(quotation.id);
        toast.success("Quotation rejected");
      } else if (action === "reopen") {
        await reopenQuotation.mutateAsync(quotation.id);
        toast.success("Quotation reopened");
      } else if (action === "send") {
        await sendQuotation.mutateAsync(quotation.id);
        toast.success("Quotation sent");
      } else if (action === "accept") {
        await acceptQuotation.mutateAsync(quotation.id);
        toast.success("Quotation accepted");
      } else if (action === "decline") {
        await declineQuotation.mutateAsync(quotation.id);
        toast.success("Quotation declined");
      } else if (action === "cancel") {
        await cancelQuotation.mutateAsync(quotation.id);
        toast.success("Quotation cancelled");
      } else if (action === "clone") {
        const cloned = await cloneQuotation.mutateAsync(quotation.id);
        toast.success("Quotation cloned");
        router.push(`/quotations/${cloned.id}`);
      }
      setConfirming(null);
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
        description="This cannot be undone."
        confirmLabel={confirmLabel}
        pending={pending}
        variant={confirming && DESTRUCTIVE_ACTIONS.has(confirming) ? "destructive" : "default"}
        onOpenChange={(open) => !open && setConfirming(null)}
        onConfirm={() => {
          if (confirming) {
            void runAction(confirming);
          }
        }}
      />
    </>
  );
}
