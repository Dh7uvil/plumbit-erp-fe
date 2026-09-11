import { TaxRegisterScreen } from "@/modules/erp/accounting/reports/components/tax-register-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.tax}>
      <TaxRegisterScreen kind="purchase" />
    </PermissionGate>
  );
}
