import { AnalysisReportScreen } from "@/modules/erp/accounting/reports/components/analysis-report-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.financial}>
      <AnalysisReportScreen kind="sales" />
    </PermissionGate>
  );
}
