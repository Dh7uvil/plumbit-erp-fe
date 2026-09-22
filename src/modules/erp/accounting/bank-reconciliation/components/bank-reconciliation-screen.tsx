"use client";

import Link from "next/link";

import { useBankStatements } from "@/modules/erp/accounting/bank-reconciliation/queries";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ImexToolbar } from "@/shared/components/imex/imex-toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useCan } from "@/shared/providers/session-provider";
import { useTableParams } from "@/shared/hooks/use-table-params";

export function BankReconciliationScreen() {
  const { canCreate } = useCrudPermissions(bankReconciliationPermissions);
  const can = useCan();
  const canImport = can(bankReconciliationPermissions.import);
  const canExport = can(bankReconciliationPermissions.export);
  const { page, page_size, setPage } = useTableParams();
  const query = useBankStatements({ page, page_size });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const canAddStatement = canCreate || canImport;

  return (
    <ListPage>
      <PageHeader
        title="Bank reconciliation"
        subtitle="Import statements, match book entries, and close periods."
        actions={
          <div className="flex items-center gap-2">
            <ImexToolbar
              resource="bank-reconciliation"
              title="bank statements"
              canImport={false}
              canExport={canExport}
              exportParams={{ page, page_size }}
            />
            {canAddStatement ? (
              <Button asChild>
                <Link href="/bank-reconciliation/new">New statement</Link>
              </Button>
            ) : null}
          </div>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Closing balance</TableHead>
            <TableHead>Lines</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ) : query.isError ? (
            <TableRow>
              <TableCell colSpan={4}>
                <DataTableError
                  message={getErrorMessage(query.error)}
                  onRetry={() => query.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>
                <DataTableEmpty
                  title="No bank statements"
                  message={emptyListMessage(
                    canAddStatement,
                    "Create a bank statement to begin reconciliation.",
                  )}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/bank-reconciliation/${row.id}`}
                    className="font-medium hover:underline"
                  >
                    {row.period_start} — {row.period_end}
                  </Link>
                  {row.import_reference ? (
                    <div className="text-muted-foreground text-xs">{row.import_reference}</div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.status}</Badge>
                </TableCell>
                <TableCell>{row.closing_balance}</TableCell>
                <TableCell>{row.lines.length}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
    </ListPage>
  );
}
