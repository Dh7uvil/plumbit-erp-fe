import { SalesReturnDetailScreen } from "@/modules/inventory-management/sales-returns/components/sales-return-detail-screen";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SalesReturnEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={salesReturnPermissions.update}
      notFoundMessage="Sales return not found."
    >
      {(id) => <SalesReturnDetailScreen returnId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
