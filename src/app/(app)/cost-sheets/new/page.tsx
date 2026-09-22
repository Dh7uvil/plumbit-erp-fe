import { CostSheetNewScreen } from "@/modules/erp/cost-sheets/components/cost-sheet-new-screen";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CostSheetNewPage() {
  return (
    <PermissionGate permission={costSheetPermissions.create}>
      <CostSheetNewScreen />
    </PermissionGate>
  );
}
