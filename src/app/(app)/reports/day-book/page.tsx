import { Suspense } from "react";

import { UnifiedDayBookScreen } from "@/modules/erp/accounting/reports/components/unified-day-book-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function DayBookPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PermissionGate permission={reportPermissions.dayBook}>
        <UnifiedDayBookScreen />
      </PermissionGate>
    </Suspense>
  );
}
