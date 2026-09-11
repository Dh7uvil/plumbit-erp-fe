import { ReceivedNotBilledScreen } from "@/modules/erp/accounting/reports/components/received-not-billed-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ReceivedNotBilledPage() {
  return (
    <PermissionGate permission={reportPermissions.inventory}>
      <ReceivedNotBilledScreen />
    </PermissionGate>
  );
}
