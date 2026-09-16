import { PurchaseOrderDetailScreen } from "@/modules/erp/purchase-orders/components/purchase-order-detail-screen";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={purchaseOrderPermissions.read}
      notFoundMessage="Purchase order not found."
    >
      {(id) => <PurchaseOrderDetailScreen purchaseOrderId={id} mode="view" />}
    </DetailPageRoute>
  );
}
