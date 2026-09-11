import { SupplierPaymentsScreen } from "@/modules/erp/supplier-payments/components/supplier-payments-screen";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SupplierPaymentsPage() {
  return (
    <PermissionGate permission={supplierPaymentPermissions.read}>
      <SupplierPaymentsScreen />
    </PermissionGate>
  );
}
