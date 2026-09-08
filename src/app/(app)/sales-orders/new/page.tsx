import { SalesOrderNewScreen } from "@/modules/erp/sales-orders/components/sales-order-new-screen";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewSalesOrderPage() {
  return (
    <PermissionGate permission={salesOrderPermissions.create}>
      <SalesOrderNewScreen />
    </PermissionGate>
  );
}
