"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useActivateBudget, useCloseBudget } from "@/modules/erp/accounting/budgets/mutations";
import { budgetPermissions } from "@/modules/erp/accounting/budgets/permissions";
import { useBudget, useBudgetVsActual } from "@/modules/erp/accounting/budgets/queries";
import { glHref } from "@/modules/erp/accounting/reports/schemas";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function BudgetDetailScreen({ budgetId }: { budgetId: string }) {
  const can = useCan();
  const budgetQuery = useBudget(budgetId);
  const budget = budgetQuery.data;
  const year = budget?.fiscal_year ?? new Date().getFullYear();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const comparisonQuery = useBudgetVsActual(
    budgetId,
    from,
    to,
    Boolean(budget) && budget?.status !== "DRAFT" && can(reportPermissions.financial),
  );
  const accountsQuery = useAllAccounts({}, can(accountPermissions.read));
  const activate = useActivateBudget();
  const close = useCloseBudget();
  const accountName = new Map((accountsQuery.data ?? []).map((account) => [account.id, account]));
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, comparisonQuery.data?.currency_code);

  async function runAction(kind: "activate" | "close") {
    if (!budget) {
      return;
    }
    try {
      if (kind === "activate") {
        await activate.mutateAsync({ id: budget.id, version: budget.version });
        toast.success("Budget activated");
      } else {
        await close.mutateAsync({ id: budget.id, version: budget.version });
        toast.success("Budget closed");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (budgetQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (budgetQuery.isError || !budget) {
    return (
      <DataTableError
        message={getErrorMessage(budgetQuery.error)}
        onRetry={() => budgetQuery.refetch()}
      />
    );
  }

  const actions = budget.available_actions;
  return (
    <ListPage>
      <PageHeader
        title={budget.name}
        subtitle={`${budget.fiscal_year} · ${budget.status}`}
        actions={
          <div className="flex gap-2">
            {actions.includes("activate") && can(budgetPermissions.activate) ? (
              <Button
                type="button"
                disabled={activate.isPending}
                onClick={() => void runAction("activate")}
              >
                {activate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Activate
              </Button>
            ) : null}
            {actions.includes("close") && can(budgetPermissions.close) ? (
              <Button
                type="button"
                variant="outline"
                disabled={close.isPending}
                onClick={() => void runAction("close")}
              >
                Close
              </Button>
            ) : null}
          </div>
        }
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budget.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
                <DataTableEmpty
                  title="No lines"
                  message="Add a line before activating this budget."
                />
              </TableCell>
            </TableRow>
          ) : (
            budget.lines.map((line) => {
              const account = accountName.get(line.account_id);
              return (
                <TableRow key={line.id}>
                  <TableCell>
                    <RecordLink href={glHref(line.account_id, from, to)}>
                      {account ? `${account.code} — ${account.name}` : line.account_id}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{line.period_start}</TableCell>
                  <TableCell>{line.amount}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
      {budget.status !== "DRAFT" && can(reportPermissions.financial) ? (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Budget vs actual</h2>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : comparisonQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <DataTableError
                      message={getErrorMessage(comparisonQuery.error)}
                      onRetry={() => comparisonQuery.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : (comparisonQuery.data?.lines.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <DataTableEmpty
                      title="No comparison"
                      message="No budget lines fall in this fiscal year."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                comparisonQuery.data?.lines.map((line) => (
                  <TableRow key={`${line.account_id}-${line.period_start}`}>
                    <TableCell>
                      <RecordLink href={glHref(line.account_id, from, to)}>
                        {line.account_code} — {line.account_name}
                      </RecordLink>
                    </TableCell>
                    <TableCell>{line.period_start}</TableCell>
                    <TableCell>{money(line.budget_amount)}</TableCell>
                    <TableCell>{money(line.actual_amount)}</TableCell>
                    <TableCell>{money(line.variance_amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </div>
      ) : null}
    </ListPage>
  );
}
