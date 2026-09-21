import { LeadsScreen } from "@/modules/crm/leads/components/leads-screen";
import { leadPermissions } from "@/modules/crm/leads/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function LeadsPage() {
  return (
    <PermissionGate permission={leadPermissions.read}>
      <LeadsScreen />
    </PermissionGate>
  );
}
