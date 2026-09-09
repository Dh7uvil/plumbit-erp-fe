"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useAcceptQuotation,
  useApproveQuotation,
  useCancelQuotation,
  useCloneQuotation,
  useConvertQuotationToSalesOrder,
  useDeclineQuotation,
  useDeleteQuotation,
  useRejectQuotation,
  useReopenQuotation,
  useReviseQuotation,
  useSendQuotation,
  useSubmitQuotation,
} from "@/modules/erp/quotations/mutations";
import type { Quotation } from "@/modules/erp/quotations/schemas";
import type { QuotationWorkflowAction } from "@/modules/erp/quotations/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useQuotationWorkflow(quotation: Quotation) {
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
  const convertQuotation = useConvertQuotationToSalesOrder();
  const reviseQuotation = useReviseQuotation();
  const deleteQuotation = useDeleteQuotation();
  const write = { id: quotation.id, version: quotation.version };

  return async function onAction(action: QuotationWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "submit") {
      await submitQuotation.mutateAsync(write);
      toast.success("Quotation submitted");
    } else if (action === "approve") {
      await approveQuotation.mutateAsync(write);
      toast.success("Quotation approved");
    } else if (action === "reject") {
      await rejectQuotation.mutateAsync({ ...write, reason: extras.reason });
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
    } else if (action === "revise") {
      if (!extras.reason) {
        throw new Error("A revision reason is required");
      }
      await reviseQuotation.mutateAsync({ ...write, revision_reason: extras.reason });
      toast.success("Revision created");
      router.push(`/quotations/${quotation.id}/edit`);
    } else if (action === "clone") {
      const cloned = await cloneQuotation.mutateAsync(quotation.id);
      toast.success("Quotation cloned");
      router.push(`/quotations/${cloned.id}`);
    } else if (action === "convert") {
      const order = await convertQuotation.mutateAsync(write);
      toast.success("Sales order created");
      router.push(`/sales-orders/${order.id}`);
    } else if (action === "delete") {
      await deleteQuotation.mutateAsync(write);
      toast.success("Quotation deleted");
      router.push("/quotations");
    }
  };
}
