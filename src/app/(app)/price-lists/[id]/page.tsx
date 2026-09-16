import { PriceListDetailScreen } from "@/modules/inventory-management/price-lists/components/price-list-detail-screen";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PriceListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={priceListPermissions.read}
      notFoundMessage="Price list not found."
    >
      {(id) => <PriceListDetailScreen priceListId={id} mode="view" />}
    </DetailPageRoute>
  );
}
