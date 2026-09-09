import { ProformaInvoiceNewScreen } from "@/modules/erp/proforma-invoices/components/proforma-invoice-new-screen";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewProformaInvoicePage() {
  return (
    <PermissionGate permission={proformaInvoicePermissions.create}>
      <ProformaInvoiceNewScreen />
    </PermissionGate>
  );
}
