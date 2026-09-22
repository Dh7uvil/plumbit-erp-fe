import { ChargeTypesScreen } from "@/modules/erp/accounting/charge-types/components/charge-types-screen";
import { chargeTypePermissions } from "@/modules/erp/accounting/charge-types/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ChargeTypesPage() {
  return (
    <PermissionGate permission={chargeTypePermissions.read}>
      <ChargeTypesScreen />
    </PermissionGate>
  );
}
