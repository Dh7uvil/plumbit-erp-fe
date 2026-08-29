import { DocumentSequencesScreen } from "@/modules/erp/accounting/document-sequences/components/document-sequences-screen";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function DocumentSequencesPage() {
  return (
    <PermissionGate permission={documentSequencePermissions.read}>
      <DocumentSequencesScreen />
    </PermissionGate>
  );
}
