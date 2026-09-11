import { CashFlowScreen } from "@/modules/erp/accounting/reports/components/cash-flow-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.financial}>
      <CashFlowScreen />
    </PermissionGate>
  );
}
