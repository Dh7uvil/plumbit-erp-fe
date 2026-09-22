"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelVoucher,
  useDeleteVoucher,
  usePostVoucher,
} from "@/modules/erp/accounting/vouchers/mutations";
import { vouchersListHref, type Voucher } from "@/modules/erp/accounting/vouchers/schemas";
import type { VoucherWorkflowAction } from "@/modules/erp/accounting/vouchers/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useVoucherWorkflow(voucher: Voucher) {
  const router = useRouter();
  const postVoucher = usePostVoucher(voucher.id);
  const cancelVoucher = useCancelVoucher(voucher.id);
  const deleteVoucher = useDeleteVoucher();
  const write = { id: voucher.id, version: voucher.version };

  return async function onAction(action: VoucherWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "post") {
      await postVoucher.mutateAsync(voucher.version);
      toast.success("Voucher posted");
    } else if (action === "cancel") {
      await cancelVoucher.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Voucher cancelled");
    } else if (action === "delete") {
      await deleteVoucher.mutateAsync(write);
      toast.success("Voucher deleted");
      router.push(vouchersListHref(voucher.voucher_type));
    }
  };
}
