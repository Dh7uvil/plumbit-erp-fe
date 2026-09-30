import { GrnChargeAdjustmentDetailScreen } from "@/modules/inventory-management/goods-receipt-charge-adjustments/components/grn-charge-adjustment-detail-screen";
import { grnChargeAdjustmentPermissions } from "@/modules/inventory-management/goods-receipt-charge-adjustments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GrnChargeAdjustmentDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGate permission={grnChargeAdjustmentPermissions.read}>
      <GrnChargeAdjustmentDetailScreen id={id} />
    </PermissionGate>
  );
}
