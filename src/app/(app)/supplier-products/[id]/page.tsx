import { SupplierProductDetailScreen } from "@/modules/erp/supplier-products/components/supplier-product-detail-screen";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SupplierProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={supplierProductPermissions.read}
      notFoundMessage="Catalog item not found."
    >
      {(id) => <SupplierProductDetailScreen catalogId={id} mode="view" />}
    </DetailPageRoute>
  );
}
