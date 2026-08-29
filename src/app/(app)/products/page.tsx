import { ProductsScreen } from "@/modules/inventory-management/products/components/products-screen";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ProductsPage() {
  return (
    <PermissionGate permission={productPermissions.read}>
      <ProductsScreen />
    </PermissionGate>
  );
}
