import { YearEndScreen } from "@/modules/erp/accounting/year-end/components/year-end-screen";
import { yearEndPermissions } from "@/modules/erp/accounting/year-end/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function YearEndPage() {
  return (
    <PermissionGate permission={yearEndPermissions.manage}>
      <YearEndScreen />
    </PermissionGate>
  );
}
