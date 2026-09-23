import { BudgetsScreen } from "@/modules/erp/accounting/budgets/components/budgets-screen";
import { budgetPermissions } from "@/modules/erp/accounting/budgets/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function BudgetsPage() {
  return (
    <PermissionGate permission={budgetPermissions.read}>
      <BudgetsScreen />
    </PermissionGate>
  );
}
