import { PackagesScreen } from "@/modules/inventory-management/packages/components/packages-screen";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PackagesPage() {
  return (
    <PermissionGate permission={packagePermissions.read}>
      <PackagesScreen />
    </PermissionGate>
  );
}
