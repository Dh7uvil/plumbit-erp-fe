import { UnitsScreen } from "@/modules/inventory-management/units/components/units-screen";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function UnitsPage() {
  return (
    <PermissionGate permission={unitPermissions.read}>
      <UnitsScreen />
    </PermissionGate>
  );
}
