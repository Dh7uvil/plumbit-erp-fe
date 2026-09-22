import { Suspense } from "react";

import { VouchersWorkspaceScreen } from "@/modules/erp/accounting/vouchers/components/vouchers-workspace-screen";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function VouchersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PermissionGate permission={voucherPermissions.read}>
        <VouchersWorkspaceScreen />
      </PermissionGate>
    </Suspense>
  );
}
