import { DeliveryNotesScreen } from "@/modules/inventory-management/delivery-notes/components/delivery-notes-screen";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function DeliveryNotesPage() {
  return (
    <PermissionGate permission={deliveryNotePermissions.read}>
      <DeliveryNotesScreen />
    </PermissionGate>
  );
}
