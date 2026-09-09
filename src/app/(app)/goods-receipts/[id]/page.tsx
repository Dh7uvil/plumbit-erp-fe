import { z } from "zod";

import { GoodsReceiptDetailScreen } from "@/modules/inventory-management/goods-receipts/components/goods-receipt-detail-screen";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function GoodsReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={goodsReceiptPermissions.read}>
      {parsed.success ? (
        <GoodsReceiptDetailScreen receiptId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Goods receipt not found.</p>
      )}
    </PermissionGate>
  );
}
