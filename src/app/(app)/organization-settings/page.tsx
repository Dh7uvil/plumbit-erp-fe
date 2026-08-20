import { OrganizationSettingsScreen } from "@/modules/users-management/organization-settings/components/organization-settings-screen";
import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function OrganizationSettingsPage() {
  return (
    <PermissionGate permission={organizationSettingsPermissions.read}>
      <OrganizationSettingsScreen />
    </PermissionGate>
  );
}
