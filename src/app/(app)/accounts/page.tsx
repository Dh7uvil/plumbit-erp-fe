import { AccountsScreen } from "@/modules/erp/accounting/accounts/components/accounts-screen";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AccountsPage() {
  return (
    <PermissionGate permission={accountPermissions.read}>
      <AccountsScreen />
    </PermissionGate>
  );
}
