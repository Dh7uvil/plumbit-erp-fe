import { CategoriesScreen } from "@/modules/inventory-management/categories/components/categories-screen";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CategoriesPage() {
  return (
    <PermissionGate permission={categoryPermissions.read}>
      <CategoriesScreen />
    </PermissionGate>
  );
}
