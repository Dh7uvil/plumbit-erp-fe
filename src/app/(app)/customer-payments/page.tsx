import { CustomerPaymentsScreen } from "@/modules/erp/customer-payments/components/customer-payments-screen";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CustomerPaymentsPage() {
  return (
    <PermissionGate permission={customerPaymentPermissions.read}>
      <CustomerPaymentsScreen />
    </PermissionGate>
  );
}
