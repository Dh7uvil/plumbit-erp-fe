import { SupplierProductsScreen } from "@/modules/erp/supplier-products/components/supplier-products-screen";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SupplierProductsPage() {
  return (
    <PermissionGate permission={supplierProductPermissions.read}>
      <SupplierProductsScreen />
    </PermissionGate>
  );
}
