import { CurrenciesScreen } from "@/modules/erp/currencies/components/currencies-screen";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CurrenciesPage() {
  return (
    <PermissionGate permission={currencyPermissions.read}>
      <CurrenciesScreen />
    </PermissionGate>
  );
}
