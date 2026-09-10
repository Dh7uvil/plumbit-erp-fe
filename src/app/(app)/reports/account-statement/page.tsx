import { AccountStatementScreen } from "@/modules/erp/accounting/reports/components/account-statement-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AccountStatementPage() {
  return (
    <PermissionGate permission={reportPermissions.ledger}>
      <AccountStatementScreen />
    </PermissionGate>
  );
}
