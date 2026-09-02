import { z } from "zod";

import { StockAdjustmentNewScreen } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-new-screen";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewStockAdjustmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={stockAdjustmentPermissions.create}>
      <StockAdjustmentNewScreen
        productId={optionalUuid(params.product_id)}
        warehouseId={optionalUuid(params.warehouse_id)}
      />
    </PermissionGate>
  );
}
