import { BudgetFormScreen } from "@/modules/erp/accounting/budgets/components/budget-form-screen";
import { budgetPermissions } from "@/modules/erp/accounting/budgets/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewBudgetPage() {
  return (
    <PermissionGate permission={budgetPermissions.create}>
      <BudgetFormScreen />
    </PermissionGate>
  );
}
