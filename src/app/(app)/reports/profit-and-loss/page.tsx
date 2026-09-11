import { ProfitAndLossScreen } from "@/modules/erp/accounting/reports/components/profit-and-loss-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.financial}>
      <ProfitAndLossScreen />
    </PermissionGate>
  );
}
