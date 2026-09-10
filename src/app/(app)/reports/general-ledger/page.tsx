import { GeneralLedgerScreen } from "@/modules/erp/accounting/reports/components/general-ledger-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function GeneralLedgerPage() {
  return (
    <PermissionGate permission={reportPermissions.ledger}>
      <GeneralLedgerScreen />
    </PermissionGate>
  );
}
