import { PurchaseSuggestionsScreen } from "@/modules/erp/accounting/reports/components/purchase-suggestions-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.inventory}>
      <PurchaseSuggestionsScreen />
    </PermissionGate>
  );
}
