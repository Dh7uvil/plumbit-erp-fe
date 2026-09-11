"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelProformaInvoice,
  useCloneProformaInvoice,
  useConfirmProformaInvoice,
  useDeclineProformaInvoice,
  useDeleteProformaInvoice,
  useReopenProformaInvoice,
  useReviseProformaInvoice,
  useSendProformaInvoice,
} from "@/modules/erp/proforma-invoices/mutations";
import type { ProformaInvoice } from "@/modules/erp/proforma-invoices/schemas";
import type { ProformaInvoiceWorkflowAction } from "@/modules/erp/proforma-invoices/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useProformaInvoiceWorkflow(invoice: ProformaInvoice) {
  const router = useRouter();
  const sendInvoice = useSendProformaInvoice();
  const confirmInvoice = useConfirmProformaInvoice();
  const declineInvoice = useDeclineProformaInvoice();
  const cancelInvoice = useCancelProformaInvoice();
  const reopenInvoice = useReopenProformaInvoice();
  const reviseInvoice = useReviseProformaInvoice();
  const cloneInvoice = useCloneProformaInvoice();
  const deleteInvoice = useDeleteProformaInvoice();
  const write = { id: invoice.id, version: invoice.version };

  return async function onAction(
    action: ProformaInvoiceWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "send") {
      await sendInvoice.mutateAsync(write);
      toast.success("Proforma invoice sent");
    } else if (action === "confirm") {
      await confirmInvoice.mutateAsync(write);
      toast.success("Proforma invoice confirmed");
    } else if (action === "decline") {
      await declineInvoice.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Proforma invoice declined");
    } else if (action === "cancel") {
      await cancelInvoice.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Proforma invoice cancelled");
    } else if (action === "reopen") {
      await reopenInvoice.mutateAsync(write);
      toast.success("Proforma invoice reopened");
    } else if (action === "revise") {
      await reviseInvoice.mutateAsync(write);
      toast.success("Proforma invoice revised");
      router.push(`/proforma-invoices/${invoice.id}/edit`);
    } else if (action === "clone") {
      const cloned = await cloneInvoice.mutateAsync(invoice.id);
      toast.success("Proforma invoice cloned");
      router.push(`/proforma-invoices/${cloned.id}`);
    } else if (action === "convert") {
      return;
    } else if (action === "create_sales_invoice") {
      return;
    } else if (action === "delete") {
      await deleteInvoice.mutateAsync(write);
      toast.success("Proforma invoice deleted");
      router.push("/proforma-invoices");
    }
  };
}
