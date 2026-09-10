import { ShipmentNewScreen } from "@/modules/inventory-management/shipments/components/shipment-new-screen";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewShipmentPage() {
  return (
    <PermissionGate permission={shipmentPermissions.create}>
      <ShipmentNewScreen />
    </PermissionGate>
  );
}
