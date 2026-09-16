import { StockTransferDetailScreen } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-detail-screen";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function StockTransferEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={stockTransferPermissions.update}
      notFoundMessage="Stock transfer not found."
    >
      {(id) => <StockTransferDetailScreen transferId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
