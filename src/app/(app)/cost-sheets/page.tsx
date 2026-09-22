import { CostSheetsScreen } from "@/modules/erp/cost-sheets/components/cost-sheets-screen";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CostSheetsPage() {
  return (
    <PermissionGate permission={costSheetPermissions.read}>
      <CostSheetsScreen />
    </PermissionGate>
  );
}
