import { Suspense } from "react";

import { PurchaseOrderNewScreen } from "@/modules/erp/purchase-orders/components/purchase-order-new-screen";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function NewPurchaseOrderPage() {
  return (
    <PermissionGate permission={purchaseOrderPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PurchaseOrderNewScreen />
      </Suspense>
    </PermissionGate>
  );
}
