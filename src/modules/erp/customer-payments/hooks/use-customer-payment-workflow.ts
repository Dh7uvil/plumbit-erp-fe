"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelCustomerPayment,
  useDeleteCustomerPayment,
  usePostCustomerPayment,
  useRefundCustomerPayment,
} from "@/modules/erp/customer-payments/mutations";
import type { CustomerPayment } from "@/modules/erp/customer-payments/schemas";
import type { CustomerPaymentWorkflowAction } from "@/modules/erp/customer-payments/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useCustomerPaymentWorkflow(
  payment: CustomerPayment,
  onAllocate: () => void,
) {
  const router = useRouter();
  const postPayment = usePostCustomerPayment();
  const refundPayment = useRefundCustomerPayment();
  const cancelPayment = useCancelCustomerPayment();
  const deletePayment = useDeleteCustomerPayment();
  const write = { id: payment.id, version: payment.version };

  return async function onAction(
    action: CustomerPaymentWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postPayment.mutateAsync(write);
      toast.success("Receipt posted");
    } else if (action === "allocate") {
      onAllocate();
    } else if (action === "refund") {
      await refundPayment.mutateAsync(write);
      toast.success("Unapplied remainder refunded");
    } else if (action === "cancel") {
      await cancelPayment.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Receipt cancelled");
    } else if (action === "delete") {
      await deletePayment.mutateAsync(write);
      toast.success("Receipt deleted");
      router.push("/customer-payments");
    }
  };
}
