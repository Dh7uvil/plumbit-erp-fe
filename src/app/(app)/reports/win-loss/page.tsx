import { WinLossScreen } from "@/modules/crm/reports/components/win-loss-screen";
import { crmReportPermissions } from "@/modules/crm/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={crmReportPermissions.read}>
      <WinLossScreen />
    </PermissionGate>
  );
}
