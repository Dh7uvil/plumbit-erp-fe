import { VoucherEntryScreen } from "@/modules/erp/accounting/vouchers/components/voucher-entry-screen";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function VoucherEntryPage() {
  return (
    <PermissionGate permission={voucherPermissions.create}>
      <VoucherEntryScreen />
    </PermissionGate>
  );
}
