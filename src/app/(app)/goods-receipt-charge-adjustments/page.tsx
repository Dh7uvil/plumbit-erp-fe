import { GrnChargeAdjustmentsScreen } from "@/modules/inventory-management/goods-receipt-charge-adjustments/components/grn-charge-adjustments-screen";
import { grnChargeAdjustmentPermissions } from "@/modules/inventory-management/goods-receipt-charge-adjustments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function GrnChargeAdjustmentsPage() {
  return (
    <PermissionGate permission={grnChargeAdjustmentPermissions.read}>
      <GrnChargeAdjustmentsScreen />
    </PermissionGate>
  );
}
