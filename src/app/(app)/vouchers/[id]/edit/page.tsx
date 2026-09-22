import { VoucherDetailScreen } from "@/modules/erp/accounting/vouchers/components/voucher-detail-screen";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function EditVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={voucherPermissions.update}>
      <VoucherDetailScreen voucherId={id} mode="edit" />
    </PermissionGate>
  );
}
