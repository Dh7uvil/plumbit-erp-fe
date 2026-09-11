"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelSupplierPayment,
  useDeleteSupplierPayment,
  usePostSupplierPayment,
  useRefundSupplierPayment,
} from "@/modules/erp/supplier-payments/mutations";
import type { SupplierPayment } from "@/modules/erp/supplier-payments/schemas";
import type { SupplierPaymentWorkflowAction } from "@/modules/erp/supplier-payments/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useSupplierPaymentWorkflow(payment: SupplierPayment, onAllocate: () => void) {
  const router = useRouter();
  const postPayment = usePostSupplierPayment();
  const refundPayment = useRefundSupplierPayment();
  const cancelPayment = useCancelSupplierPayment();
  const deletePayment = useDeleteSupplierPayment();
  const write = { id: payment.id, version: payment.version };

  return async function onAction(
    action: SupplierPaymentWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postPayment.mutateAsync(write);
      toast.success("Payment posted");
    } else if (action === "allocate") {
      onAllocate();
    } else if (action === "refund") {
      await refundPayment.mutateAsync(write);
      toast.success("Unapplied remainder refunded");
    } else if (action === "cancel") {
      await cancelPayment.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Payment cancelled");
    } else if (action === "delete") {
      await deletePayment.mutateAsync(write);
      toast.success("Payment deleted");
      router.push("/supplier-payments");
    }
  };
}
