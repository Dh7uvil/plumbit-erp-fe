import { CostSheetEntryScreen } from "@/modules/erp/cost-sheets/components/cost-sheet-entry-screen";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CostSheetEntryPage() {
  return (
    <PermissionGate permission={costSheetPermissions.create}>
      <CostSheetEntryScreen />
    </PermissionGate>
  );
}
