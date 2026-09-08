import { SalesOrdersScreen } from "@/modules/erp/sales-orders/components/sales-orders-screen";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SalesOrdersPage() {
  return (
    <PermissionGate permission={salesOrderPermissions.read}>
      <SalesOrdersScreen />
    </PermissionGate>
  );
}
