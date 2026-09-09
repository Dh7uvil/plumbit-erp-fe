import { GoodsReceiptsScreen } from "@/modules/inventory-management/goods-receipts/components/goods-receipts-screen";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function GoodsReceiptsPage() {
  return (
    <PermissionGate permission={goodsReceiptPermissions.read}>
      <GoodsReceiptsScreen />
    </PermissionGate>
  );
}
