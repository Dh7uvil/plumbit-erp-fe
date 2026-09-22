import { ChequesScreen } from "@/modules/erp/accounting/cheques/components/cheques-screen";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ChequesPage() {
  return (
    <PermissionGate permission={chequePermissions.read}>
      <ChequesScreen />
    </PermissionGate>
  );
}
