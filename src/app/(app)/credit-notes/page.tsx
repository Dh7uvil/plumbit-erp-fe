import { CreditNotesScreen } from "@/modules/erp/credit-notes/components/credit-notes-screen";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CreditNotesPage() {
  return (
    <PermissionGate permission={creditNotePermissions.read}>
      <CreditNotesScreen />
    </PermissionGate>
  );
}
