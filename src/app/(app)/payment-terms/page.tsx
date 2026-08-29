import { PaymentTermsScreen } from "@/modules/erp/accounting/payment-terms/components/payment-terms-screen";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PaymentTermsPage() {
  return (
    <PermissionGate permission={paymentTermPermissions.read}>
      <PaymentTermsScreen />
    </PermissionGate>
  );
}
