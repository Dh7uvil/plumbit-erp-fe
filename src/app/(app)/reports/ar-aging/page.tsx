import { AgingReportScreen } from "@/modules/erp/accounting/reports/components/aging-report-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ArAgingPage() {
  return (
    <PermissionGate permission={reportPermissions.arAp}>
      <AgingReportScreen kind="ar" />
    </PermissionGate>
  );
}
