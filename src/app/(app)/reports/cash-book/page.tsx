import { DayBookScreen } from "@/modules/erp/accounting/reports/components/day-book-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CashBookPage() {
  return (
    <PermissionGate permission={reportPermissions.ledger}>
      <DayBookScreen
        bookKind="cash"
        title="Cash book"
        subtitle="Day book for cash accounts with opening and closing balances"
        exportSlug="cash-book"
        apiPath="/reports/cash-book"
      />
    </PermissionGate>
  );
}
