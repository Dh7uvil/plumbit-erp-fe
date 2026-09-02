import { StockMovementsScreen } from "@/modules/inventory-management/stock/components/stock-movements-screen";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function StockMovementsPage() {
  return (
    <PermissionGate permission={stockPermissions.read}>
      <StockMovementsScreen />
    </PermissionGate>
  );
}
