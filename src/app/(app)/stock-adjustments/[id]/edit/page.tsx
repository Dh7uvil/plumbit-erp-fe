import { z } from "zod";

import { StockAdjustmentDetailScreen } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-detail-screen";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function StockAdjustmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={stockAdjustmentPermissions.update}>
      {parsed.success ? (
        <StockAdjustmentDetailScreen adjustmentId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Stock adjustment not found.</p>
      )}
    </PermissionGate>
  );
}
