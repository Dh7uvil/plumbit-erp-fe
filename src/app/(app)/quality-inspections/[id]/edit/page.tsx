import { z } from "zod";

import { QualityInspectionDetailScreen } from "@/modules/inventory-management/quality-inspections/components/quality-inspection-detail-screen";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function QualityInspectionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={qualityInspectionPermissions.update}>
      {parsed.success ? (
        <QualityInspectionDetailScreen inspectionId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Quality inspection not found.</p>
      )}
    </PermissionGate>
  );
}
