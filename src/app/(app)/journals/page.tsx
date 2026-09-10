import { JournalsScreen } from "@/modules/erp/accounting/journals/components/journals-screen";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function JournalsPage() {
  return (
    <PermissionGate permission={journalPermissions.read}>
      <JournalsScreen />
    </PermissionGate>
  );
}
