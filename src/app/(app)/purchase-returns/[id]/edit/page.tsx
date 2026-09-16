import { PurchaseReturnDetailScreen } from "@/modules/inventory-management/purchase-returns/components/purchase-return-detail-screen";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PurchaseReturnEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={purchaseReturnPermissions.update}
      notFoundMessage="Purchase return not found."
    >
      {(id) => <PurchaseReturnDetailScreen returnId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
