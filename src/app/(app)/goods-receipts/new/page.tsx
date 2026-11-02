import { Suspense } from "react";
import { z } from "zod";

import { GoodsReceiptNewScreen } from "@/modules/inventory-management/goods-receipts/components/goods-receipt-new-screen";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewGoodsReceiptPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={goodsReceiptPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewGoodsReceiptContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewGoodsReceiptContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <GoodsReceiptNewScreen purchaseOrderId={optionalUuid(params.purchase_order_id)} />;
}
