import { BankReconciliationDetailScreen } from "@/modules/erp/accounting/bank-reconciliation/components/bank-reconciliation-detail-screen";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function BankReconciliationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PermissionGate permission={bankReconciliationPermissions.read}>
      <BankReconciliationDetailScreen id={id} />
    </PermissionGate>
  );
}
