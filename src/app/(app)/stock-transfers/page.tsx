import { StockTransfersScreen } from "@/modules/inventory-management/stock-transfers/components/stock-transfers-screen";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function StockTransfersPage() {
  return (
    <PermissionGate permission={stockTransferPermissions.read}>
      <StockTransfersScreen />
    </PermissionGate>
  );
}
