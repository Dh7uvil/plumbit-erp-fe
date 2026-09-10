import { z } from "zod";

import { PackageDetailScreen } from "@/modules/inventory-management/packages/components/package-detail-screen";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function PackageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={packagePermissions.update}>
      {parsed.success ? (
        <PackageDetailScreen packageId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Package not found.</p>
      )}
    </PermissionGate>
  );
}
