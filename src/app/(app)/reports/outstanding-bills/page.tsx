import { OutstandingDocumentsScreen } from "@/modules/erp/accounting/reports/components/outstanding-documents-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.arAp}>
      <OutstandingDocumentsScreen kind="bills" />
    </PermissionGate>
  );
}
