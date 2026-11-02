import { Suspense } from "react";
import { z } from "zod";

import { StockTransferNewScreen } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-new-screen";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewStockTransferPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={stockTransferPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewStockTransferContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewStockTransferContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <StockTransferNewScreen
      productId={optionalUuid(params.product_id)}
      warehouseId={optionalUuid(params.warehouse_id)}
    />
  );
}
