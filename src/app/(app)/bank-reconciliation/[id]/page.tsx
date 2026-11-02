import { BankReconciliationDetailScreen } from "@/modules/erp/accounting/bank-reconciliation/components/bank-reconciliation-detail-screen";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function BankReconciliationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DetailPageRoute
      params={params}
      permission={bankReconciliationPermissions.read}
      notFoundMessage="Bank reconciliation not found."
    >
      {(id) => <BankReconciliationDetailScreen id={id} />}
    </DetailPageRoute>
  );
}
