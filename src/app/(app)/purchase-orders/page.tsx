import { PurchaseOrdersScreen } from "@/modules/erp/purchase-orders/components/purchase-orders-screen";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PurchaseOrdersPage() {
  return (
    <PermissionGate permission={purchaseOrderPermissions.read}>
      <PurchaseOrdersScreen />
    </PermissionGate>
  );
}
