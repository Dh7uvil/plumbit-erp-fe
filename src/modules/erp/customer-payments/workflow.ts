import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import type { CustomerPayment } from "@/modules/erp/customer-payments/schemas";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const CUSTOMER_PAYMENT_WORKFLOW_ACTIONS = [
  "post",
  "allocate",
  "refund",
  "cancel",
  "delete",
] as const;
export type CustomerPaymentWorkflowAction = (typeof CUSTOMER_PAYMENT_WORKFLOW_ACTIONS)[number];

export function customerPaymentActionRegistry(
  payment: Pick<CustomerPayment, "tax_amount"> | null,
): DocumentActionSpec<CustomerPaymentWorkflowAction>[] {
  const vatPosts = Boolean(payment && payment.tax_amount !== "0" && payment.tax_amount !== "0.00");
  return [
    {
      action: "post",
      label: "Post",
      permission: customerPaymentPermissions.post,
      confirmCopy: (documentNumber) =>
        vatPosts
          ? `Posting ${documentNumber}: the cash or bank account will increase by the amount received. Allocated amounts settle AR; any remainder is an advance. Bank charges post separately. VAT on this standard-rated advance will also post.`
          : `Posting ${documentNumber}: the cash or bank account will increase by the amount received. Allocated amounts settle AR; any remainder is an advance from the customer. Bank charges, if any, post separately.`,
    },
    {
      action: "allocate",
      label: "Allocate",
      permission: customerPaymentPermissions.update,
    },
    {
      action: "refund",
      label: "Refund",
      permission: customerPaymentPermissions.post,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `The unapplied remainder on ${documentNumber} will be refunded to the payment account. Advance (and any advance VAT) will reverse.`,
    },
    {
      action: "cancel",
      label: "Cancel",
      permission: customerPaymentPermissions.cancel,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be reversed. Invoice balances and unapplied credits return to their prior state.`,
      reasonField: { placeholder: "Why this receipt is being cancelled" },
    },
    {
      action: "delete",
      label: "Delete",
      permission: customerPaymentPermissions.delete,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be removed. Only draft receipts can be deleted.`,
    },
  ];
}
