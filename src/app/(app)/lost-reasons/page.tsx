import { LostReasonsScreen } from "@/modules/crm/lost-reasons/components/lost-reasons-screen";
import { lostReasonPermissions } from "@/modules/crm/lost-reasons/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function LostReasonsPage() {
  return (
    <PermissionGate permission={lostReasonPermissions.read}>
      <LostReasonsScreen />
    </PermissionGate>
  );
}
