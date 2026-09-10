import { JournalNewScreen } from "@/modules/erp/accounting/journals/components/journal-new-screen";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewJournalPage() {
  return (
    <PermissionGate permission={journalPermissions.create}>
      <JournalNewScreen />
    </PermissionGate>
  );
}
