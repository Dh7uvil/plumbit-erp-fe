import { ExchangeRatesScreen } from "@/modules/erp/exchange-rates/components/exchange-rates-screen";
import { exchangeRatePermissions } from "@/modules/erp/exchange-rates/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ExchangeRatesPage() {
  return (
    <PermissionGate permission={exchangeRatePermissions.read}>
      <ExchangeRatesScreen />
    </PermissionGate>
  );
}
