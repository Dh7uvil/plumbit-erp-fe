import { Suspense } from "react";

import { CashBankBookScreen } from "@/modules/erp/accounting/reports/components/cash-bank-book-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function CashBookPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PermissionGate permission={reportPermissions.ledger}>
        <CashBankBookScreen
          bookKind="cash"
          title="Cash book"
          subtitle="Day book for cash accounts with opening and closing balances"
          exportSlug="cash-book"
          apiPath="/reports/cash-book"
        />
      </PermissionGate>
    </Suspense>
  );
}
