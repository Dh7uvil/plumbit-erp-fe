import { TaxesScreen } from "@/modules/erp/accounting/taxes/components/taxes-screen";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function TaxesPage() {
  return (
    <PermissionGate permission={taxPermissions.read}>
      <TaxesScreen />
    </PermissionGate>
  );
}
