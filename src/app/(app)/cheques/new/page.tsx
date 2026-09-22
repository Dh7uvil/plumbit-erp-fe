import { Suspense } from "react";

import { ChequeNewScreen } from "@/modules/erp/accounting/cheques/components/cheque-new-screen";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function NewChequePage() {
  return (
    <PermissionGate permission={chequePermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ChequeNewScreen />
      </Suspense>
    </PermissionGate>
  );
}
