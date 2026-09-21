import { ActivitiesScreen } from "@/modules/crm/activities/components/activities-screen";
import { activityPermissions } from "@/modules/crm/activities/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ActivitiesPage() {
  return (
    <PermissionGate permission={activityPermissions.read}>
      <ActivitiesScreen />
    </PermissionGate>
  );
}
