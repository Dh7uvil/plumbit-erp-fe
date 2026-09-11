import { Suspense } from "react";

import { CustomerPaymentNewScreen } from "@/modules/erp/customer-payments/components/customer-payment-new-screen";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function NewCustomerPaymentPage() {
  return (
    <PermissionGate permission={customerPaymentPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <CustomerPaymentNewScreen />
      </Suspense>
    </PermissionGate>
  );
}
