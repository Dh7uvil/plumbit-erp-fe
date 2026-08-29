import { QuotationsScreen } from "@/modules/erp/quotations/components/quotations-screen";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function QuotationsPage() {
  return (
    <PermissionGate permission={quotationPermissions.read}>
      <QuotationsScreen />
    </PermissionGate>
  );
}
