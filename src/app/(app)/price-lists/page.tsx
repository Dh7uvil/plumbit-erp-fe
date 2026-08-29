import { PriceListsScreen } from "@/modules/inventory-management/price-lists/components/price-lists-screen";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PriceListsPage() {
  return (
    <PermissionGate permission={priceListPermissions.read}>
      <PriceListsScreen />
    </PermissionGate>
  );
}
