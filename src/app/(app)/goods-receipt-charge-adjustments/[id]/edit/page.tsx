import { GrnChargeAdjustmentForm } from "@/modules/inventory-management/goods-receipt-charge-adjustments/components/grn-charge-adjustment-form";
import { grnChargeAdjustmentPermissions } from "@/modules/inventory-management/goods-receipt-charge-adjustments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function EditGrnChargeAdjustmentPage() {
  return (
    <PermissionGate permission={grnChargeAdjustmentPermissions.update}>
      <GrnChargeAdjustmentForm />
    </PermissionGate>
  );
}
