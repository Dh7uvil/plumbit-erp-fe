import { z } from "zod";

import { WarehouseDetailScreen } from "@/modules/inventory-management/warehouses/components/warehouse-detail-screen";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function WarehouseDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={warehousePermissions.update}>
      {parsed.success ? (
        <WarehouseDetailScreen warehouseId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Warehouse not found.</p>
      )}
    </PermissionGate>
  );
}
