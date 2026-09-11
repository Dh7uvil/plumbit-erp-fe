import { BalanceSheetScreen } from "@/modules/erp/accounting/reports/components/balance-sheet-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.financial}>
      <BalanceSheetScreen />
    </PermissionGate>
  );
}
