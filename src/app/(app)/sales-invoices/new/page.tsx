import { SalesInvoiceNewScreen } from "@/modules/erp/sales-invoices/components/sales-invoice-new-screen";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewSalesInvoicePage() {
  return (
    <PermissionGate permission={salesInvoicePermissions.create}>
      <SalesInvoiceNewScreen />
    </PermissionGate>
  );
}
