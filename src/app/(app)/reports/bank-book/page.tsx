import { Suspense } from "react";

import { CashBankBookScreen } from "@/modules/erp/accounting/reports/components/cash-bank-book-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function BankBookPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PermissionGate permission={reportPermissions.ledger}>
        <CashBankBookScreen
          bookKind="bank"
          title="Bank book"
          subtitle="Day book for bank accounts with opening and closing balances"
          exportSlug="bank-book"
          apiPath="/reports/bank-book"
        />
      </PermissionGate>
    </Suspense>
  );
}
