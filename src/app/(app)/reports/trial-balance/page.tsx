import { TrialBalanceScreen } from "@/modules/erp/accounting/reports/components/trial-balance-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function TrialBalancePage() {
  return (
    <PermissionGate permission={reportPermissions.ledger}>
      <TrialBalanceScreen />
    </PermissionGate>
  );
}
