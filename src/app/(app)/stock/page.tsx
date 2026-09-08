import { StockScreen } from "@/modules/inventory-management/stock/components/stock-screen";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function StockPage() {
  return (
    <PermissionGate permission={stockPermissions.read}>
      <StockScreen />
    </PermissionGate>
  );
}
