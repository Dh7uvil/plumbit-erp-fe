import { BankAccountsScreen } from "@/modules/erp/accounting/bank-accounts/components/bank-accounts-screen";
import { bankAccountPermissions } from "@/modules/erp/accounting/bank-accounts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function BankAccountsPage() {
  return (
    <PermissionGate permission={bankAccountPermissions.read}>
      <BankAccountsScreen />
    </PermissionGate>
  );
}
