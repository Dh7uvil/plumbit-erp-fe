import { z } from "zod";

import { StockDetailScreen } from "@/modules/inventory-management/stock/components/stock-detail-screen";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function StockProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const parsed = IdSchema.safeParse(productId);

  return (
    <PermissionGate permission={stockPermissions.read}>
      {parsed.success ? (
        <StockDetailScreen productId={parsed.data} />
      ) : (
        <p className="text-muted-foreground text-sm">Product not found.</p>
      )}
    </PermissionGate>
  );
}
