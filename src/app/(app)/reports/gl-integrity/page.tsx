import { GlIntegrityScreen } from "@/modules/erp/accounting/integrity/components/gl-integrity-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function GlIntegrityPage() {
  return (
    <PermissionGate permission={reportPermissions.ledger}>
      <GlIntegrityScreen />
    </PermissionGate>
  );
}
