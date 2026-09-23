import { RecurringScreen } from "@/modules/erp/accounting/recurring/components/recurring-screen";
import { recurringPermissions } from "@/modules/erp/accounting/recurring/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function RecurringPage() {
  return (
    <PermissionGate permission={recurringPermissions.read}>
      <RecurringScreen />
    </PermissionGate>
  );
}
