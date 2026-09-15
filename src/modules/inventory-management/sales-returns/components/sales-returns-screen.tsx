"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useDeleteSalesReturn } from "@/modules/inventory-management/sales-returns/mutations";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { useSalesReturns } from "@/modules/inventory-management/sales-returns/queries";
import {
  SALES_RETURN_REASON_LABELS,
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  salesReturnDisplayNumber,
  type SalesReturn,
  type StockDocumentStatus,
} from "@/modules/inventory-management/sales-returns/schemas";
import { SALES_RETURN_ACTION_REGISTRY } from "@/modules/inventory-management/sales-returns/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate } from "@/shared/lib/format";

const ALL = "all";

function parseStatus(value: string | undefined): StockDocumentStatus | undefined {
  return STOCK_DOCUMENT_STATUSES.includes(value as StockDocumentStatus)
    ? (value as StockDocumentStatus)
    : undefined;
}

export function SalesReturnsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(salesReturnPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const returnsQuery = useSalesReturns({
    page,
    page_size,
    search,
    status: parseStatus(filters.status),
  });
  const deleteReturn = useDeleteSalesReturn();
  const [deleting, setDeleting] = useState<SalesReturn | null>(null);
  const rows = returnsQuery.data?.data ?? [];
  const meta = returnsQuery.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<SalesReturn>> => {
    return [
      {
        id: "document_number",
        header: "Number",
        className: "font-mono text-sm",
        cell: (row) => (
          <RecordLink href={`/sales-returns/${row.id}`}>
            {salesReturnDisplayNumber(row) ?? "—"}
          </RecordLink>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: (row) => SALES_RETURN_REASON_LABELS[row.reason_code],
      },
      {
        id: "document_date",
        header: "Date",
        cell: (row) => formatDate(row.document_date),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <DocumentStatusBadge
            status={row.status}
            labels={STOCK_DOCUMENT_STATUS_LABELS}
            variants={STOCK_DOCUMENT_STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "is_posted",
        header: "Posted",
        defaultVisible: false,
        cell: (row) => (row.is_posted ? "Posted" : "Draft"),
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "max-w-xs truncate",
        cell: (row) => row.notes || "—",
      },
      ...auditTimestampColumns<SalesReturn>(),
      ...auditActorColumns<SalesReturn>(userNameById),
      ...actionsColumn<SalesReturn>(showActions, (row) => {
        const number = salesReturnDisplayNumber(row);
        return (
          <DataTableRowActions
            entityName={number ?? "sales return"}
            viewHref={canRead ? `/sales-returns/${row.id}` : undefined}
            editHref={
              canUpdate && row.status === "DRAFT" ? `/sales-returns/${row.id}/edit` : undefined
            }
            onDelete={
              row.available_actions.includes("delete") && canDelete
                ? () => setDeleting(row)
                : undefined
            }
          />
        );
      }),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns(
    "inventory.sales_returns",
    columnDefs,
  );

  async function onDelete() {
    if (!deleting) return;
    try {
      await deleteReturn.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Sales return deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Sales returns"
        subtitle="Return goods against a posted delivery note"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/sales-returns/new">
                <Plus className="size-3.5" />
                New sales return
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search number, customer, notes…"
        />
        <FilterSelect
          label="Status"
          className="w-40"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...STOCK_DOCUMENT_STATUSES.map((status) => ({
              value: status,
              label: STOCK_DOCUMENT_STATUS_LABELS[status],
            })),
          ]}
        />
        {columnsDialog}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads columns={columns} onSort={setParams} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {returnsQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : returnsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(returnsQuery.error)}
                  onRetry={() => returnsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No sales returns"
                  message={emptyListMessage(canCreate, "Create a sales return from a posted delivery note.")}
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
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={`Delete sales return ${deleting ? (salesReturnDisplayNumber(deleting) ?? "sales return") : ""}`}
        description={
          deleting
            ? (getDocumentAction(SALES_RETURN_ACTION_REGISTRY, "delete").confirmCopy?.(
                salesReturnDisplayNumber(deleting) ?? "sales return",
              ) ?? "")
            : ""
        }
        confirmLabel="Delete"
        pending={deleteReturn.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={() => void onDelete()}
      />
    </ListPage>
  );
}
