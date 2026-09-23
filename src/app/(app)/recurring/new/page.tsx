import { RecurringFormScreen } from "@/modules/erp/accounting/recurring/components/recurring-form-screen";
import { recurringPermissions } from "@/modules/erp/accounting/recurring/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewRecurringPage() {
  return (
    <PermissionGate permission={recurringPermissions.create}>
      <RecurringFormScreen />
    </PermissionGate>
  );
}
