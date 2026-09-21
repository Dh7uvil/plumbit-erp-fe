import { DayBookScreen } from "@/modules/erp/accounting/reports/components/day-book-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function BankBookPage() {
  return (
    <PermissionGate permission={reportPermissions.ledger}>
      <DayBookScreen
        bookKind="bank"
        title="Bank book"
        subtitle="Day book for bank accounts with opening and closing balances"
        exportSlug="bank-book"
        apiPath="/reports/bank-book"
      />
    </PermissionGate>
  );
}
