import { SalesReturnsScreen } from "@/modules/inventory-management/sales-returns/components/sales-returns-screen";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SalesReturnsPage() {
  return (
    <PermissionGate permission={salesReturnPermissions.read}>
      <SalesReturnsScreen />
    </PermissionGate>
  );
}
