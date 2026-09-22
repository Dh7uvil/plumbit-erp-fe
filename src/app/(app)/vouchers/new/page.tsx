import { VoucherNewScreen } from "@/modules/erp/accounting/vouchers/components/voucher-new-screen";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewVoucherPage() {
  return (
    <PermissionGate permission={voucherPermissions.create}>
      <VoucherNewScreen />
    </PermissionGate>
  );
}
