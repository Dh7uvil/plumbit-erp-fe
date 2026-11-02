import { Suspense } from "react";
import { z } from "zod";

import { StockAdjustmentNewScreen } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-new-screen";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewStockAdjustmentPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={stockAdjustmentPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewStockAdjustmentContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewStockAdjustmentContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <StockAdjustmentNewScreen
      productId={optionalUuid(params.product_id)}
      warehouseId={optionalUuid(params.warehouse_id)}
    />
  );
}
