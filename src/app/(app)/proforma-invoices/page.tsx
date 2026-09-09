import { ProformaInvoicesScreen } from "@/modules/erp/proforma-invoices/components/proforma-invoices-screen";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ProformaInvoicesPage() {
  return (
    <PermissionGate permission={proformaInvoicePermissions.read}>
      <ProformaInvoicesScreen />
    </PermissionGate>
  );
}
