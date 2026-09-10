"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AccountFormDialog } from "@/modules/erp/accounting/accounts/components/account-form-dialog";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useMapSystemRole } from "@/modules/erp/accounting/accounts/mutations";
import { useAllAccounts, useSystemRoleMappings } from "@/modules/erp/accounting/accounts/queries";
import {
  ACCOUNT_SYSTEM_ROLE_LABELS,
  type AccountSystemRole,
} from "@/modules/erp/accounting/accounts/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { OPTIONAL_SELECT_NONE } from "@/config/constants";

export function SystemAccountsCard() {
  const { canUpdate, canCreate } = useCrudPermissions(accountPermissions);
  const rolesQuery = useSystemRoleMappings();
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const mapRole = useMapSystemRole();
  const [creating, setCreating] = useState(false);
  const rows = rolesQuery.data ?? [];
  const unmapped = rows.filter((row) => !row.account_id);
  const accounts = accountsQuery.data ?? [];

  async function onMap(role: AccountSystemRole, accountId: string) {
    if (!accountId || accountId === OPTIONAL_SELECT_NONE) {
      return;
    }
    try {
      await mapRole.mutateAsync({ role, accountId });
      toast.success(`${ACCOUNT_SYSTEM_ROLE_LABELS[role]} mapped`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System accounts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {unmapped.length > 0 ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {unmapped.length} system role{unmapped.length === 1 ? "" : "s"} unmapped. Posting
              cannot proceed until every role has an account.
            </AlertDescription>
          </Alert>
        ) : null}
        {rolesQuery.isLoading ? <Skeleton className="h-40 w-full" /> : null}
        {rolesQuery.isError ? (
          <p className="text-destructive text-sm">{getErrorMessage(rolesQuery.error)}</p>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.role} className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">{ACCOUNT_SYSTEM_ROLE_LABELS[row.role]}</p>
              <MasterSelect
                value={row.account_id ?? OPTIONAL_SELECT_NONE}
                onValueChange={(value) => void onMap(row.role, value)}
                disabled={!canUpdate || mapRole.isPending}
                placeholder="Unmapped"
                searchPlaceholder="Search account…"
                createLabel="Create account"
                onCreate={canCreate ? () => setCreating(true) : undefined}
                asFormControl={false}
                options={[
                  ...accounts
                    .filter((account) => !account.is_group)
                    .map((account) => ({
                      value: account.id,
                      label: `${account.code} — ${account.name}`,
                    })),
                ]}
              />
            </div>
          ))}
        </div>
      </CardContent>
      <AccountFormDialog open={creating} account={null} onOpenChange={setCreating} />
    </Card>
  );
}
