import { LandedCostsScreen } from "@/modules/erp/landed-costs/components/landed-costs-screen";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function LandedCostsPage() {
  return (
    <PermissionGate permission={landedCostPermissions.read}>
      <LandedCostsScreen />
    </PermissionGate>
  );
}
