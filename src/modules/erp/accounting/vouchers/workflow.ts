import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const VOUCHER_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type VoucherWorkflowAction = (typeof VOUCHER_WORKFLOW_ACTIONS)[number];

export const VOUCHER_ACTION_REGISTRY: DocumentActionSpec<VoucherWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: voucherPermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber} will create the ledger entry and apply any draft allocations.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: voucherPermissions.cancel,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be reversed. Invoice balances and unapplied amounts return to their prior state.`,
    reasonField: { placeholder: "Why this voucher is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: voucherPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft vouchers can be deleted.`,
  },
];
