import { z } from "zod";

import { PriceListDetailScreen } from "@/modules/inventory-management/price-lists/components/price-list-detail-screen";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const PriceListIdSchema = z.string().uuid();

export default async function PriceListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = PriceListIdSchema.safeParse(id);

  return (
    <PermissionGate permission={priceListPermissions.read}>
      {parsed.success ? (
        <PriceListDetailScreen priceListId={parsed.data} />
      ) : (
        <p className="text-muted-foreground text-sm">Price list not found.</p>
      )}
    </PermissionGate>
  );
}
