"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelPurchaseInvoice,
  useDeletePurchaseInvoice,
  usePostPurchaseInvoice,
} from "@/modules/erp/purchase-invoices/mutations";
import type { PurchaseInvoice } from "@/modules/erp/purchase-invoices/schemas";
import type { PurchaseInvoiceWorkflowAction } from "@/modules/erp/purchase-invoices/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function usePurchaseInvoiceWorkflow(invoice: PurchaseInvoice) {
  const router = useRouter();
  const postInvoice = usePostPurchaseInvoice();
  const cancelInvoice = useCancelPurchaseInvoice();
  const deleteInvoice = useDeletePurchaseInvoice();
  const write = { id: invoice.id, version: invoice.version };

  return async function onAction(
    action: PurchaseInvoiceWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postInvoice.mutateAsync(write);
      toast.success("Purchase invoice posted");
    } else if (action === "cancel") {
      await cancelInvoice.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Purchase invoice cancelled");
    } else if (action === "delete") {
      await deleteInvoice.mutateAsync(write);
      toast.success("Purchase invoice deleted");
      router.push("/purchase-invoices");
    }
  };
}
