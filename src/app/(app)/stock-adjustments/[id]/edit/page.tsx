import { StockAdjustmentDetailScreen } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-detail-screen";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function StockAdjustmentEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={stockAdjustmentPermissions.update}
      notFoundMessage="Stock adjustment not found."
    >
      {(id) => <StockAdjustmentDetailScreen adjustmentId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
