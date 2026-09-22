import { StockDetailScreen } from "@/modules/inventory-management/stock/components/stock-detail-screen";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function StockProductPage({ params }: { params: Promise<{ productId: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      paramKey="productId"
      permission={stockPermissions.read}
      notFoundMessage="Product not found."
    >
      {(productId) => <StockDetailScreen productId={productId} />}
    </DetailPageRoute>
  );
}
