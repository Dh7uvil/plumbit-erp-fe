import { z } from "zod";

import { QualityInspectionDetailScreen } from "@/modules/inventory-management/quality-inspections/components/quality-inspection-detail-screen";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function QualityInspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={qualityInspectionPermissions.read}>
      {parsed.success ? (
        <QualityInspectionDetailScreen inspectionId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Quality inspection not found.</p>
      )}
    </PermissionGate>
  );
}
