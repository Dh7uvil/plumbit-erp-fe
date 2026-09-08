import { PurchaseOrderNewScreen } from "@/modules/erp/purchase-orders/components/purchase-order-new-screen";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewPurchaseOrderPage() {
  return (
    <PermissionGate permission={purchaseOrderPermissions.create}>
      <PurchaseOrderNewScreen />
    </PermissionGate>
  );
}
