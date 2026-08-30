import { z } from "zod";

import { UnitDetailScreen } from "@/modules/inventory-management/units/components/unit-detail-screen";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={unitPermissions.read}>
      {parsed.success ? (
        <UnitDetailScreen unitId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Unit not found.</p>
      )}
    </PermissionGate>
  );
}
