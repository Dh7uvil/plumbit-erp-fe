import { SuppliersScreen } from "@/modules/erp/suppliers/components/suppliers-screen";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SuppliersPage() {
  return (
    <PermissionGate permission={supplierPermissions.read}>
      <SuppliersScreen />
    </PermissionGate>
  );
}
