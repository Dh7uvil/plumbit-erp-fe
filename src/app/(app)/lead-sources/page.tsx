import { LeadSourcesScreen } from "@/modules/crm/lead-sources/components/lead-sources-screen";
import { leadSourcePermissions } from "@/modules/crm/lead-sources/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function LeadSourcesPage() {
  return (
    <PermissionGate permission={leadSourcePermissions.read}>
      <LeadSourcesScreen />
    </PermissionGate>
  );
}
