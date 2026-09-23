import { BudgetDetailScreen } from "@/modules/erp/accounting/budgets/components/budget-detail-screen";
import { budgetPermissions } from "@/modules/erp/accounting/budgets/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={budgetPermissions.read}
      notFoundMessage="Budget not found."
    >
      {(id) => <BudgetDetailScreen budgetId={id} />}
    </DetailPageRoute>
  );
}
