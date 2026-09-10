import { PurchaseInvoicesScreen } from "@/modules/erp/purchase-invoices/components/purchase-invoices-screen";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PurchaseInvoicesPage() {
  return (
    <PermissionGate permission={purchaseInvoicePermissions.read}>
      <PurchaseInvoicesScreen />
    </PermissionGate>
  );
}
