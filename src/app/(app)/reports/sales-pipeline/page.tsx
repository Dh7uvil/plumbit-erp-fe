import { SalesPipelineScreen } from "@/modules/crm/reports/components/sales-pipeline-screen";
import { crmReportPermissions } from "@/modules/crm/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={crmReportPermissions.read}>
      <SalesPipelineScreen />
    </PermissionGate>
  );
}
