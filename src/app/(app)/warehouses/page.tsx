import { WarehousesScreen } from "@/modules/inventory-management/warehouses/components/warehouses-screen";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function WarehousesPage() {
  return (
    <PermissionGate permission={warehousePermissions.read}>
      <WarehousesScreen />
    </PermissionGate>
  );
}
