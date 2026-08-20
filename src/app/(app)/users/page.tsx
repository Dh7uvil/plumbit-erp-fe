import { UsersScreen } from "@/modules/users-management/users/components/users-screen";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function UsersPage() {
  return (
    <PermissionGate permission={userPermissions.read}>
      <UsersScreen />
    </PermissionGate>
  );
}
