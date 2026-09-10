import { DebitNoteNewScreen } from "@/modules/erp/debit-notes/components/debit-note-new-screen";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewDebitNotePage() {
  return (
    <PermissionGate permission={debitNotePermissions.create}>
      <DebitNoteNewScreen />
    </PermissionGate>
  );
}
