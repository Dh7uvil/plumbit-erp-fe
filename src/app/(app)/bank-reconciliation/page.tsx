import { BankReconciliationScreen } from "@/modules/erp/accounting/bank-reconciliation/components/bank-reconciliation-screen";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function BankReconciliationPage() {
  return (
    <PermissionGate permission={bankReconciliationPermissions.read}>
      <BankReconciliationScreen />
    </PermissionGate>
  );
}
