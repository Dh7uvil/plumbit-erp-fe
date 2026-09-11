import { StockMovementReportScreen } from "@/modules/erp/accounting/reports/components/stock-movement-report-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.inventory}>
      <StockMovementReportScreen />
    </PermissionGate>
  );
}
