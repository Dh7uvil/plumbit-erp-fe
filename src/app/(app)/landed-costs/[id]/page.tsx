import { z } from "zod";

import { LandedCostDetailScreen } from "@/modules/erp/landed-costs/components/landed-cost-detail-screen";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function LandedCostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={landedCostPermissions.read}>
      {parsed.success ? (
        <LandedCostDetailScreen landedCostId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Landed cost not found.</p>
      )}
    </PermissionGate>
  );
}
