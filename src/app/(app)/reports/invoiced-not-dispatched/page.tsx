import { InvoicedNotDispatchedScreen } from "@/modules/erp/accounting/reports/components/invoiced-not-dispatched-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InvoicedNotDispatchedPage() {
  return (
    <PermissionGate permission={reportPermissions.tax}>
      <InvoicedNotDispatchedScreen />
    </PermissionGate>
  );
}
