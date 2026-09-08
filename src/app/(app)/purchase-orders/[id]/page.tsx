import { z } from "zod";

import { PurchaseOrderDetailScreen } from "@/modules/erp/purchase-orders/components/purchase-order-detail-screen";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const PurchaseOrderIdSchema = z.string().uuid();

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = PurchaseOrderIdSchema.safeParse(id);

  return (
    <PermissionGate permission={purchaseOrderPermissions.read}>
      {parsed.success ? (
        <PurchaseOrderDetailScreen purchaseOrderId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Purchase order not found.</p>
      )}
    </PermissionGate>
  );
}
