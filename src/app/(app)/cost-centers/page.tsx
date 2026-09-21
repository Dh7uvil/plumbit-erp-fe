import { CostCentersScreen } from "@/modules/erp/accounting/cost-centers/components/cost-centers-screen";
import { costCenterPermissions } from "@/modules/erp/accounting/cost-centers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CostCentersPage() {
  return (
    <PermissionGate permission={costCenterPermissions.read}>
      <CostCentersScreen />
    </PermissionGate>
  );
}
