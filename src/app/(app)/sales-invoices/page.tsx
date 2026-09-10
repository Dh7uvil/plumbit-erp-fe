import { SalesInvoicesScreen } from "@/modules/erp/sales-invoices/components/sales-invoices-screen";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SalesInvoicesPage() {
  return (
    <PermissionGate permission={salesInvoicePermissions.read}>
      <SalesInvoicesScreen />
    </PermissionGate>
  );
}
