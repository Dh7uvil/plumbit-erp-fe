import { z } from "zod";

import { SalesReturnDetailScreen } from "@/modules/inventory-management/sales-returns/components/sales-return-detail-screen";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function SalesReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={salesReturnPermissions.read}>
      {parsed.success ? (
        <SalesReturnDetailScreen returnId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Sales return not found.</p>
      )}
    </PermissionGate>
  );
}
