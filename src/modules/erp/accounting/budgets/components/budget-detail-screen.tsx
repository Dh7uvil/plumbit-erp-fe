"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatReportMoney, humanizeEnum } from "@/shared/lib/format";
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
  const [pendingAction, setPendingAction] = useState<"activate" | "close" | null>(null);
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
      setPendingAction(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (budgetQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (budgetQuery.isError || !budget) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={getErrorMessage(budgetQuery.error)}
          onRetry={() => budgetQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/budgets">Back to budgets</Link>
        </Button>
      </div>
    );
  }

  const actions = budget.available_actions;
  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={budget.name}
        listHref="/budgets"
        viewHref={`/budgets/${budget.id}`}
        canUpdate={false}
        mode="view"
        badges={
          <DocumentStatusBadge
            status={budget.status as "DRAFT" | "ACTIVE" | "CLOSED"}
            labels={{ DRAFT: "Draft", ACTIVE: "Active", CLOSED: "Closed" }}
            variants={{ DRAFT: "warning", ACTIVE: "success", CLOSED: "muted" }}
          />
        }
        extraActions={
          <div className="flex gap-2">
            {actions.includes("activate") && can(budgetPermissions.activate) ? (
              <Button type="button" onClick={() => setPendingAction("activate")}>
                Activate
              </Button>
            ) : null}
            {actions.includes("close") && can(budgetPermissions.close) ? (
              <Button type="button" variant="outline" onClick={() => setPendingAction("close")}>
                Close
              </Button>
            ) : null}
          </div>
        }
      />
      <p className="text-muted-foreground text-sm">
        Fiscal year {budget.fiscal_year} · {humanizeEnum(budget.status)}
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                      <TableCell className="tabular-nums">{line.amount}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
      {budget.status !== "DRAFT" && can(reportPermissions.financial) ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Budget vs actual</h2>
          {comparisonQuery.data ? (
            <div className="grid gap-3 rounded-lg border p-4 text-sm md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-muted-foreground">Income budget / actual</div>
                <div className="font-medium tabular-nums">
                  {money(comparisonQuery.data.total_budget_income)} /{" "}
                  {money(comparisonQuery.data.total_actual_income)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Expense budget / actual</div>
                <div className="font-medium tabular-nums">
                  {money(comparisonQuery.data.total_budget_expense)} /{" "}
                  {money(comparisonQuery.data.total_actual_expense)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total budget</div>
                <div className="font-medium tabular-nums">
                  {money(comparisonQuery.data.total_budget)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total variance</div>
                <div className="font-medium tabular-nums">
                  {money(comparisonQuery.data.total_variance)}
                </div>
              </div>
            </div>
          ) : null}
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
                    <TableCell className="tabular-nums">{money(line.budget_amount)}</TableCell>
                    <TableCell className="tabular-nums">{money(line.actual_amount)}</TableCell>
                    <TableCell className="tabular-nums">{money(line.variance_amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </div>
      ) : null}
      <ConfirmActionDialog
        open={pendingAction === "activate"}
        title="Activate budget"
        description={`Activate ${budget.name}? This makes the budget available for comparison.`}
        confirmLabel="Activate"
        pending={activate.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        onConfirm={() => void runAction("activate")}
      />
      <ConfirmActionDialog
        open={pendingAction === "close"}
        title="Close budget"
        description={`Close ${budget.name}? No further changes can be made.`}
        confirmLabel="Close"
        pending={close.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        onConfirm={() => void runAction("close")}
      />
    </div>
  );
}
