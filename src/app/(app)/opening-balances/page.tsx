import { OpeningBalancesScreen } from "@/modules/erp/accounting/opening-balances/components/opening-balances-screen";
import { openingBalancePermissions } from "@/modules/erp/accounting/opening-balances/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function OpeningBalancesPage() {
  return (
    <PermissionGate permission={openingBalancePermissions.manage}>
      <OpeningBalancesScreen />
    </PermissionGate>
  );
}
