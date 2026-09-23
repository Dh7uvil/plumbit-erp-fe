"use client";

import Link from "next/link";

import { budgetPermissions } from "@/modules/erp/accounting/budgets/permissions";
import { useBudgets } from "@/modules/erp/accounting/budgets/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
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
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

export function BudgetsScreen() {
  const can = useCan();
  const { page, page_size, search, setPage } = useTableParams();
  const budgetsQuery = useBudgets({ page, page_size, search });
  const rows = budgetsQuery.data?.data ?? [];
  const meta = budgetsQuery.data?.meta;

  return (
    <ListPage>
      <PageHeader
        title="Budgets"
        subtitle="Plans by account and period. Activating a budget does not post journals."
        actions={
          can(budgetPermissions.create) ? (
            <Button asChild>
              <Link href="/budgets/new">New budget</Link>
            </Button>
          ) : undefined
        }
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Fiscal year</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgetsQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={3}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : budgetsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={3}>
                <DataTableError
                  message={getErrorMessage(budgetsQuery.error)}
                  onRetry={() => budgetsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
                <DataTableEmpty
                  title="No budgets"
                  message="Create a budget to compare with the ledger."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <RecordLink href={`/budgets/${row.id}`}>{row.name}</RecordLink>
                </TableCell>
                <TableCell>{row.fiscal_year}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      {meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
    </ListPage>
  );
}
