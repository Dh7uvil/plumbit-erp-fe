import { PurchaseReturnsScreen } from "@/modules/inventory-management/purchase-returns/components/purchase-returns-screen";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PurchaseReturnsPage() {
  return (
    <PermissionGate permission={purchaseReturnPermissions.read}>
      <PurchaseReturnsScreen />
    </PermissionGate>
  );
}
