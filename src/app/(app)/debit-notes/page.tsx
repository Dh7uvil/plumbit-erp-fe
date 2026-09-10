import { DebitNotesScreen } from "@/modules/erp/debit-notes/components/debit-notes-screen";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function DebitNotesPage() {
  return (
    <PermissionGate permission={debitNotePermissions.read}>
      <DebitNotesScreen />
    </PermissionGate>
  );
}
