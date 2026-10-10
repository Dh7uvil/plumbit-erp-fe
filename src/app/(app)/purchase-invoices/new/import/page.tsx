import { PurchaseInvoiceNewScreen } from "@/modules/erp/purchase-invoices/components/purchase-invoice-new-screen";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewImportPurchaseInvoicePage() {
  return (
    <PermissionGate permission={purchaseInvoicePermissions.create}>
      <PurchaseInvoiceNewScreen importPreset />
    </PermissionGate>
  );
}
