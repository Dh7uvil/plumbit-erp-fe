"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AccountForm } from "@/modules/erp/accounting/accounts/components/account-form";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useAccount } from "@/modules/erp/accounting/accounts/queries";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function AccountDetailScreen({
  accountId,
  mode,
}: {
  accountId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(accountPermissions);
  const accountQuery = useAccount(accountId);
  const account = accountQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/accounts/${accountId}`;

  if (accountQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (accountQuery.isError || !account) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={accountQuery.error ? getErrorMessage(accountQuery.error) : "Account not found"}
          onRetry={() => accountQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/accounts">Back to accounts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={account.name}
        code={account.code}
        listHref="/accounts"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
        badges={
          <>
            {account.is_group ? <Badge variant="secondary">Group</Badge> : null}
            {account.is_system ? <Badge variant="info">System</Badge> : null}
            {account.system_role ? <Badge variant="outline">{account.system_role}</Badge> : null}
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit account" : "Account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm
            account={account}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {isEdit ? null : (
        <>
          <EntityAttachmentsPanel entityType="ACCOUNT" entityId={account.id} />
          <ActivityFeed entityType="account" entityId={account.id} />
        </>
      )}
    </div>
  );
}
