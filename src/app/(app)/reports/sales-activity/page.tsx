import { SalesActivityScreen } from "@/modules/crm/reports/components/sales-activity-screen";
import { crmReportPermissions } from "@/modules/crm/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={crmReportPermissions.read}>
      <SalesActivityScreen />
    </PermissionGate>
  );
}
