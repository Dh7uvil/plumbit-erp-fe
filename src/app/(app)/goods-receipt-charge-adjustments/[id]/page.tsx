import { GrnChargeAdjustmentDetailScreen } from "@/modules/inventory-management/goods-receipt-charge-adjustments/components/grn-charge-adjustment-detail-screen";
import { grnChargeAdjustmentPermissions } from "@/modules/inventory-management/goods-receipt-charge-adjustments/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function GrnChargeAdjustmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DetailPageRoute
      params={params}
      permission={grnChargeAdjustmentPermissions.read}
      notFoundMessage="Charge adjustment not found."
    >
      {(id) => <GrnChargeAdjustmentDetailScreen id={id} />}
    </DetailPageRoute>
  );
}
