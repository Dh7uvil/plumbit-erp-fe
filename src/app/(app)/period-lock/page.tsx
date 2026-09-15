import { TransactionLockCard } from "@/modules/erp/period-lock/components/transaction-lock-card";
import { periodLockPermissions } from "@/modules/erp/period-lock/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";

export default function PeriodLockPage() {
  return (
    <PermissionGate permission={periodLockPermissions.read}>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Period lock"
          subtitle="Soft and hard lock dates stop posting into closed periods. Clearing a lock requires a reason."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TransactionLockCard />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
