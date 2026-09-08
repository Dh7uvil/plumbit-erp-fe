import { z } from "zod";

import { StockTransferDetailScreen } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-detail-screen";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function StockTransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={stockTransferPermissions.read}>
      {parsed.success ? (
        <StockTransferDetailScreen transferId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Stock transfer not found.</p>
      )}
    </PermissionGate>
  );
}
