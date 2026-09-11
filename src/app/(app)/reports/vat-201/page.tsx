import { Vat201Screen } from "@/modules/erp/accounting/reports/components/vat-201-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.tax}>
      <Vat201Screen />
    </PermissionGate>
  );
}
