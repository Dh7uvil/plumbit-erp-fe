import { Suspense } from "react";

import { SupplierPaymentNewScreen } from "@/modules/erp/supplier-payments/components/supplier-payment-new-screen";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function NewSupplierPaymentPage() {
  return (
    <PermissionGate permission={supplierPaymentPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SupplierPaymentNewScreen />
      </Suspense>
    </PermissionGate>
  );
}
