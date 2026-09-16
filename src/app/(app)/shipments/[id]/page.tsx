import { ShipmentDetailScreen } from "@/modules/inventory-management/shipments/components/shipment-detail-screen";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={shipmentPermissions.read}
      notFoundMessage="Shipment not found."
    >
      {(id) => <ShipmentDetailScreen shipmentId={id} mode="view" />}
    </DetailPageRoute>
  );
}
