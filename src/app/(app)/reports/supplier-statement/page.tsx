import { PartyStatementScreen } from "@/modules/erp/accounting/reports/components/party-statement-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SupplierStatementPage() {
  return (
    <PermissionGate permission={reportPermissions.arAp}>
      <PartyStatementScreen kind="supplier" />
    </PermissionGate>
  );
}
