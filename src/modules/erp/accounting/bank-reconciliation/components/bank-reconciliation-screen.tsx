"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useBankStatements } from "@/modules/erp/accounting/bank-reconciliation/queries";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import type { BankStatement } from "@/modules/erp/accounting/bank-reconciliation/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ImexToolbar } from "@/shared/components/imex/imex-toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";
import { useTableParams } from "@/shared/hooks/use-table-params";

const STATUS_LABELS = {
  DRAFT: "Draft",
  IMPORTED: "Imported",
  RECONCILED: "Reconciled",
} as const;

const STATUS_VARIANTS = {
  DRAFT: "warning",
  IMPORTED: "info",
  RECONCILED: "success",
} as const;

export function BankReconciliationScreen() {
  const { canCreate } = useCrudPermissions(bankReconciliationPermissions);
  const can = useCan();
  const canImport = can(bankReconciliationPermissions.import);
  const canExport = can(bankReconciliationPermissions.export);
  const ALL = "all";
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const query = useBankStatements({
    page,
    page_size,
    search,
    status: filters.status,
  });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const canAddStatement = canCreate || canImport;

  const columnDefs = useMemo((): Array<DataTableColumn<BankStatement>> => {
    return [
      {
        id: "period",
        header: "Period",
        cell: (row) => (
          <div>
            <RecordLink href={`/bank-reconciliation/${row.id}`}>
              {formatDate(row.period_start)} — {formatDate(row.period_end)}
            </RecordLink>
            {row.import_reference ? (
              <div className="text-muted-foreground text-xs">{row.import_reference}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <DocumentStatusBadge status={row.status} labels={STATUS_LABELS} variants={STATUS_VARIANTS} />
        ),
      },
      {
        id: "closing_balance",
        header: "Closing balance",
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (row) => row.closing_balance,
      },
      {
        id: "lines",
        header: "Lines",
        className: "tabular-nums",
        cell: (row) => row.lines.length,
      },
    ];
  }, []);

  const { columns, columnsDialog, colSpan } = useTableColumns(
    "erp.bank_reconciliation",
    columnDefs,
  );

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
              <Button type="button" size="sm" asChild>
                <Link href="/bank-reconciliation/new">
                  <Plus className="size-3.5" />
                  New statement
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null, page: 1 })}
          placeholder="Search import reference…"
        />
        <FilterSelect
          label="Status"
          className="w-44"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All statuses" },
            { value: "DRAFT", label: "Draft" },
            { value: "IMPORTED", label: "Imported" },
            { value: "RECONCILED", label: "Reconciled" },
          ]}
        />
        {columnsDialog}
        {search || filters.status ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setParams({ search: null, filters: { status: null }, page: 1 })}
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads columns={columns} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : query.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(query.error)}
                  onRetry={() => query.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
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
                <DataTableCells columns={columns} row={row} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
