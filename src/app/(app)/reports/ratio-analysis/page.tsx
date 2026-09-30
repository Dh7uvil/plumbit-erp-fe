import { RatioAnalysisScreen } from "@/modules/erp/accounting/reports/components/ratio-analysis-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.financial}>
      <RatioAnalysisScreen />
    </PermissionGate>
  );
}
