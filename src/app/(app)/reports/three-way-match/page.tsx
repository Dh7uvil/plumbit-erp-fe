import { ThreeWayMatchScreen } from "@/modules/erp/accounting/reports/components/three-way-match-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ThreeWayMatchPage() {
  return (
    <PermissionGate permission={reportPermissions.inventory}>
      <ThreeWayMatchScreen />
    </PermissionGate>
  );
}
