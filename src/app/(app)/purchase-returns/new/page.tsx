import { Suspense } from "react";
import { z } from "zod";

import { PurchaseReturnNewScreen } from "@/modules/inventory-management/purchase-returns/components/purchase-return-new-screen";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewPurchaseReturnPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={purchaseReturnPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewPurchaseReturnContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewPurchaseReturnContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <PurchaseReturnNewScreen goodsReceiptId={optionalUuid(params.goods_receipt_id)} />;
}
