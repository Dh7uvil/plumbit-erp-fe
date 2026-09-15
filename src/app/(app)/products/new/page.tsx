import { ProductNewScreen } from "@/modules/inventory-management/products/components/product-new-screen";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewProductPage() {
  return (
    <PermissionGate permission={productPermissions.create}>
      <ProductNewScreen />
    </PermissionGate>
  );
}
