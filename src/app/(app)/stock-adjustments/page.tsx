import { StockAdjustmentsScreen } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustments-screen";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function StockAdjustmentsPage() {
  return (
    <PermissionGate permission={stockAdjustmentPermissions.read}>
      <StockAdjustmentsScreen />
    </PermissionGate>
  );
}
