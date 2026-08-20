import { Suspense } from "react";

import { PermissionsScreen } from "@/modules/users-management/permissions/components/permissions-screen";
import { permissionCatalogPermissions } from "@/modules/users-management/permissions/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function PermissionsPage() {
  return (
    <PermissionGate permission={permissionCatalogPermissions.read}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PermissionsScreen />
      </Suspense>
    </PermissionGate>
  );
}
