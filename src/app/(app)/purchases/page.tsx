import { PurchasesWorkspaceScreen } from "@/modules/erp/purchases/components/purchases-workspace-screen";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PurchasesPage() {
  return (
    <PermissionGate permission={purchaseOrderPermissions.read}>
      <PurchasesWorkspaceScreen />
    </PermissionGate>
  );
}
