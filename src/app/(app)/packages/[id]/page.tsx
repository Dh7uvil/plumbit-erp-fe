import { z } from "zod";

import { PackageDetailScreen } from "@/modules/inventory-management/packages/components/package-detail-screen";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={packagePermissions.read}>
      {parsed.success ? (
        <PackageDetailScreen packageId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Package not found.</p>
      )}
    </PermissionGate>
  );
}
