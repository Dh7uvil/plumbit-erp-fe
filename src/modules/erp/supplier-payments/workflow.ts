import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const SUPPLIER_PAYMENT_WORKFLOW_ACTIONS = [
  "post",
  "allocate",
  "refund",
  "cancel",
  "delete",
] as const;
export type SupplierPaymentWorkflowAction = (typeof SUPPLIER_PAYMENT_WORKFLOW_ACTIONS)[number];

export const SUPPLIER_PAYMENT_ACTION_REGISTRY: DocumentActionSpec<SupplierPaymentWorkflowAction>[] =
  [
    {
      action: "post",
      label: "Post",
      permission: supplierPaymentPermissions.post,
      confirmCopy: (documentNumber) =>
        `Posting ${documentNumber}: the cash or bank account will decrease by the amount paid. Allocated amounts settle AP; any remainder is an advance to the supplier. Bank charges, if any, post separately. Realized FX posts if the bill rate differs from the payment-date rate.`,
    },
    {
      action: "allocate",
      label: "Allocate",
      permission: supplierPaymentPermissions.update,
    },
    {
      action: "refund",
      label: "Refund",
      permission: supplierPaymentPermissions.post,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `The unapplied remainder on ${documentNumber} will be refunded to the payment account. The supplier advance will reverse.`,
    },
    {
      action: "cancel",
      label: "Cancel",
      permission: supplierPaymentPermissions.cancel,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be reversed. Bill balances return to their prior state.`,
      reasonField: { placeholder: "Why this payment is being cancelled" },
    },
    {
      action: "delete",
      label: "Delete",
      permission: supplierPaymentPermissions.delete,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be removed. Only draft payments can be deleted.`,
    },
  ];
