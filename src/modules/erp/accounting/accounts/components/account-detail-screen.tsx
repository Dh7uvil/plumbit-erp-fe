"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AccountForm } from "@/modules/erp/accounting/accounts/components/account-form";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import {
  useAccount,
  useAccountBalance,
  useAccountPeriodBalances,
} from "@/modules/erp/accounting/accounts/queries";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { glHref } from "@/modules/erp/accounting/reports/schemas";
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
import { formatReportMoney } from "@/shared/lib/format";
import { historyHref } from "@/shared/lib/history";
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { useCan } from "@/shared/providers/session-provider";

export function AccountDetailScreen({
  accountId,
  mode,
}: {
  accountId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(accountPermissions);
  const can = useCan();
  const period = useReportPeriod();
  const accountQuery = useAccount(accountId);
  const account = accountQuery.data;
  const balanceQuery = useAccountBalance(accountId, undefined, !accountQuery.isLoading);
  const periodBalancesQuery = useAccountPeriodBalances(
    accountId,
    undefined,
    !accountQuery.isLoading && !account?.is_group,
  );
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
        codeLabel="Account"
        listHref="/accounts"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
        badges={
          <>
            {account.is_group ? <Badge variant="secondary">Group</Badge> : null}
            {account.is_system ? <Badge variant="info">System</Badge> : null}
            {account.is_blocked ? <Badge variant="destructive">Blocked</Badge> : null}
            {account.system_role ? <Badge variant="outline">{account.system_role}</Badge> : null}
          </>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{isEdit ? "Edit account" : "Account"}</CardTitle>
          {mode === "view" ? (
            <HistoryHeaderButton href={historyHref("accounts", account.id, account.code)} />
          ) : null}
        </CardHeader>
        <CardContent>
          <AccountForm
            account={account}
            disabled={!isEdit}
            lockGroupFlag={Boolean(account.has_children || account.has_journal_lines)}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {isEdit ? null : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Balance</CardTitle>
            {!account.is_group && can(reportPermissions.ledger) ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={glHref(account.id, period.from, period.to)}>View ledger</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {balanceQuery.isLoading ? <Skeleton className="h-6 w-48" /> : null}
            {balanceQuery.isError ? (
              <p className="text-destructive text-sm">{getErrorMessage(balanceQuery.error)}</p>
            ) : null}
            {balanceQuery.data ? (
              <p className="text-sm tabular-nums">
                As of {balanceQuery.data.as_of}: debit{" "}
                {formatReportMoney(balanceQuery.data.debit, balanceQuery.data.currency_code)},
                credit{" "}
                {formatReportMoney(balanceQuery.data.credit, balanceQuery.data.currency_code)}.
                Signed balance{" "}
                {formatReportMoney(
                  balanceQuery.data.signed_balance,
                  balanceQuery.data.currency_code,
                )}
                .
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}
      {isEdit || account.is_group ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Period balances
              {periodBalancesQuery.data
                ? ` — FY ${periodBalancesQuery.data.fiscal_year}`
                : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {periodBalancesQuery.isLoading ? <Skeleton className="h-48 w-full" /> : null}
            {periodBalancesQuery.isError ? (
              <p className="text-destructive text-sm">
                {getErrorMessage(periodBalancesQuery.error)}
              </p>
            ) : null}
            {periodBalancesQuery.data ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3 font-medium">Period</th>
                      <th className="py-2 pr-3 font-medium text-right">Debit</th>
                      <th className="py-2 pr-3 font-medium text-right">Credit</th>
                      <th className="py-2 font-medium text-right">Cur. balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-3 font-medium">OP. Balance</td>
                      <td className="py-2 pr-3" />
                      <td className="py-2 pr-3" />
                      <td className="py-2 text-right tabular-nums">
                        {formatReportMoney(
                          periodBalancesQuery.data.opening,
                          periodBalancesQuery.data.currency_code,
                        )}
                      </td>
                    </tr>
                    {periodBalancesQuery.data.periods.map((row) => (
                      <tr key={row.period} className="border-b">
                        <td className="py-2 pr-3 tabular-nums">
                          {String(row.period).padStart(2, "0")}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {formatReportMoney(row.debit, periodBalancesQuery.data.currency_code)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {formatReportMoney(row.credit, periodBalancesQuery.data.currency_code)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatReportMoney(
                            row.closing,
                            periodBalancesQuery.data.currency_code,
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-3 font-medium">Cur. Balance</td>
                      <td className="py-2 pr-3" />
                      <td className="py-2 pr-3" />
                      <td className="py-2 text-right tabular-nums font-medium">
                        {formatReportMoney(
                          periodBalancesQuery.data.closing,
                          periodBalancesQuery.data.currency_code,
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
      {isEdit ? null : (
        <>
          <EntityAttachmentsPanel entityType="ACCOUNT" entityId={account.id} />
        </>
      )}
    </div>
  );
}
