import { z } from "zod";

import { AccountDetailScreen } from "@/modules/erp/accounting/accounts/components/account-detail-screen";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={accountPermissions.read}>
      {parsed.success ? (
        <AccountDetailScreen accountId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Account not found.</p>
      )}
    </PermissionGate>
  );
}
