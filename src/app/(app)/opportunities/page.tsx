import { OpportunitiesScreen } from "@/modules/crm/opportunities/components/opportunities-screen";
import { opportunityPermissions } from "@/modules/crm/opportunities/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function OpportunitiesPage() {
  return (
    <PermissionGate permission={opportunityPermissions.read}>
      <OpportunitiesScreen />
    </PermissionGate>
  );
}
