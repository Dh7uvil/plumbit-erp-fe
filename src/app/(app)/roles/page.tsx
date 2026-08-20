import { RolesScreen } from "@/modules/users-management/roles/components/roles-screen";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function RolesPage() {
  return (
    <PermissionGate permission={rolePermissions.read}>
      <RolesScreen />
    </PermissionGate>
  );
}
