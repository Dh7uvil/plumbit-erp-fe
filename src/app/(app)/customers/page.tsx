import { CustomersScreen } from "@/modules/crm/customers/components/customers-screen";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CustomersPage() {
  return (
    <PermissionGate permission={customerPermissions.read}>
      <CustomersScreen />
    </PermissionGate>
  );
}
