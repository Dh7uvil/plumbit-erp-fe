import { PdcRegisterScreen } from "@/modules/erp/accounting/reports/components/pdc-register-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.ledger}>
      <PdcRegisterScreen />
    </PermissionGate>
  );
}
