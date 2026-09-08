import { z } from "zod";

import { StockTransferNewScreen } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-new-screen";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewStockTransferPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={stockTransferPermissions.create}>
      <StockTransferNewScreen
        productId={optionalUuid(params.product_id)}
        warehouseId={optionalUuid(params.warehouse_id)}
      />
    </PermissionGate>
  );
}
