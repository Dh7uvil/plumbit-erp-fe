import { z } from "zod";

import { PurchaseReturnNewScreen } from "@/modules/inventory-management/purchase-returns/components/purchase-return-new-screen";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewPurchaseReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={purchaseReturnPermissions.create}>
      <PurchaseReturnNewScreen
        goodsReceiptId={optionalUuid(params.goods_receipt_id)}
      />
    </PermissionGate>
  );
}
