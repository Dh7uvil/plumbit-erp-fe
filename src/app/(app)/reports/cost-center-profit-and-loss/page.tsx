import { CostCenterProfitAndLossScreen } from "@/modules/erp/accounting/reports/components/cost-center-profit-and-loss-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.financial}>
      <CostCenterProfitAndLossScreen />
    </PermissionGate>
  );
}
