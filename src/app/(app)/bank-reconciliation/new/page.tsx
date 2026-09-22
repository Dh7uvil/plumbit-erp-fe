import { Suspense } from "react";

import { BankReconciliationNewGate } from "@/modules/erp/accounting/bank-reconciliation/components/bank-reconciliation-new-gate";
import { BankReconciliationNewScreen } from "@/modules/erp/accounting/bank-reconciliation/components/bank-reconciliation-new-screen";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function NewBankReconciliationPage() {
  return (
    <PermissionGate permission={bankReconciliationPermissions.read}>
      <BankReconciliationNewGate>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <BankReconciliationNewScreen />
        </Suspense>
      </BankReconciliationNewGate>
    </PermissionGate>
  );
}
