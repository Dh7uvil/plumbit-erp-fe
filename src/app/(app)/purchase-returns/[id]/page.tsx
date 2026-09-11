import { z } from "zod";

import { PurchaseReturnDetailScreen } from "@/modules/inventory-management/purchase-returns/components/purchase-return-detail-screen";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function PurchaseReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={purchaseReturnPermissions.read}>
      {parsed.success ? (
        <PurchaseReturnDetailScreen returnId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Purchase return not found.</p>
      )}
    </PermissionGate>
  );
}
