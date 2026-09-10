import { CreditNoteNewScreen } from "@/modules/erp/credit-notes/components/credit-note-new-screen";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewCreditNotePage() {
  return (
    <PermissionGate permission={creditNotePermissions.create}>
      <CreditNoteNewScreen />
    </PermissionGate>
  );
}
