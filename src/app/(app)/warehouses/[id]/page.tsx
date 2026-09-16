import { WarehouseDetailScreen } from "@/modules/inventory-management/warehouses/components/warehouse-detail-screen";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={warehousePermissions.read}
      notFoundMessage="Warehouse not found."
    >
      {(id) => <WarehouseDetailScreen warehouseId={id} mode="view" />}
    </DetailPageRoute>
  );
}
