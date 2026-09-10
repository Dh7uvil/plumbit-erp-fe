import { ShipmentsScreen } from "@/modules/inventory-management/shipments/components/shipments-screen";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ShipmentsPage() {
  return (
    <PermissionGate permission={shipmentPermissions.read}>
      <ShipmentsScreen />
    </PermissionGate>
  );
}
