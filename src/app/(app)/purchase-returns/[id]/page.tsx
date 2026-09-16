import { PurchaseReturnDetailScreen } from "@/modules/inventory-management/purchase-returns/components/purchase-return-detail-screen";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PurchaseReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={purchaseReturnPermissions.read}
      notFoundMessage="Purchase return not found."
    >
      {(id) => <PurchaseReturnDetailScreen returnId={id} mode="view" />}
    </DetailPageRoute>
  );
}
