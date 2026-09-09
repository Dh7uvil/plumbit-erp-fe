import { z } from "zod";

import { GoodsReceiptNewScreen } from "@/modules/inventory-management/goods-receipts/components/goods-receipt-new-screen";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewGoodsReceiptPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={goodsReceiptPermissions.create}>
      <GoodsReceiptNewScreen purchaseOrderId={optionalUuid(params.purchase_order_id)} />
    </PermissionGate>
  );
}
