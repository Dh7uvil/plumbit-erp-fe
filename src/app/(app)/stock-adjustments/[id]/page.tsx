import { StockAdjustmentDetailScreen } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-detail-screen";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function StockAdjustmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={stockAdjustmentPermissions.read}
      notFoundMessage="Stock adjustment not found."
    >
      {(id) => <StockAdjustmentDetailScreen adjustmentId={id} mode="view" />}
    </DetailPageRoute>
  );
}
