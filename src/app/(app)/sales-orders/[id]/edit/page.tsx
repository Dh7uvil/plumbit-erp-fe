import { SalesOrderDetailScreen } from "@/modules/erp/sales-orders/components/sales-order-detail-screen";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SalesOrderEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={salesOrderPermissions.update}
      notFoundMessage="Sales order not found."
    >
      {(id) => <SalesOrderDetailScreen salesOrderId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
