import { z } from "zod";

import { ShipmentDetailScreen } from "@/modules/inventory-management/shipments/components/shipment-detail-screen";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={shipmentPermissions.read}>
      {parsed.success ? (
        <ShipmentDetailScreen shipmentId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Shipment not found.</p>
      )}
    </PermissionGate>
  );
}
