import { ExportEvidenceExceptionsScreen } from "@/modules/erp/accounting/reports/components/export-evidence-exceptions-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ExportEvidenceExceptionsPage() {
  return (
    <PermissionGate permission={reportPermissions.tax}>
      <ExportEvidenceExceptionsScreen />
    </PermissionGate>
  );
}
