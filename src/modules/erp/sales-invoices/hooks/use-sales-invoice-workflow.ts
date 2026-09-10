"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelSalesInvoice,
  useDeleteSalesInvoice,
  usePostSalesInvoice,
} from "@/modules/erp/sales-invoices/mutations";
import type { SalesInvoice } from "@/modules/erp/sales-invoices/schemas";
import type { SalesInvoiceWorkflowAction } from "@/modules/erp/sales-invoices/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useSalesInvoiceWorkflow(invoice: SalesInvoice) {
  const router = useRouter();
  const postInvoice = usePostSalesInvoice();
  const cancelInvoice = useCancelSalesInvoice();
  const deleteInvoice = useDeleteSalesInvoice();
  const write = { id: invoice.id, version: invoice.version };

  return async function onAction(
    action: SalesInvoiceWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postInvoice.mutateAsync(write);
      toast.success("Sales invoice posted");
    } else if (action === "cancel") {
      await cancelInvoice.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Sales invoice cancelled");
    } else if (action === "delete") {
      await deleteInvoice.mutateAsync(write);
      toast.success("Sales invoice deleted");
      router.push("/sales-invoices");
    }
  };
}
