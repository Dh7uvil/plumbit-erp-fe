import { ProductDetailScreen } from "@/modules/inventory-management/products/components/product-detail-screen";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={productPermissions.read}
      notFoundMessage="Product not found."
    >
      {(id) => <ProductDetailScreen productId={id} mode="view" />}
    </DetailPageRoute>
  );
}
