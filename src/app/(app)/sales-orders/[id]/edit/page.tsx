import { z } from "zod";

import { SalesOrderDetailScreen } from "@/modules/erp/sales-orders/components/sales-order-detail-screen";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const SalesOrderIdSchema = z.string().uuid();

export default async function SalesOrderEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = SalesOrderIdSchema.safeParse(id);

  return (
    <PermissionGate permission={salesOrderPermissions.update}>
      {parsed.success ? (
        <SalesOrderDetailScreen salesOrderId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Sales order not found.</p>
      )}
    </PermissionGate>
  );
}
