"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ComposeFromBillsDialog } from "@/modules/erp/landed-costs/components/compose-from-bills-dialog";
import { useDeleteLandedCost } from "@/modules/erp/landed-costs/mutations";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { useLandedCosts } from "@/modules/erp/landed-costs/queries";
import {
  LANDED_COST_ALLOCATION_METHOD_LABELS,
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  landedCostDisplayNumber,
  type LandedCost,
  type StockDocumentStatus,
} from "@/modules/erp/landed-costs/schemas";
import { LANDED_COST_ACTION_REGISTRY } from "@/modules/erp/landed-costs/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Date", "Method", "Charges", "Status"] as const;
const ALL = "all";
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "document_date",
  Status: "status",
};

function parseStatus(value: string | undefined): StockDocumentStatus | undefined {
  return STOCK_DOCUMENT_STATUSES.includes(value as StockDocumentStatus)
    ? (value as StockDocumentStatus)
    : undefined;
}

export function LandedCostsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions({
    ...landedCostPermissions,
    delete: landedCostPermissions.update,
  });
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const listQuery = useLandedCosts({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });
  const deleteDocument = useDeleteLandedCost();
  const [deleting, setDeleting] = useState<LandedCost | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const rows = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  return (
    <ListPage>
      <PageHeader
        title="Landed costs"
        subtitle="Allocate posted freight and duty bills onto goods receipt layers"
        actions={
          canCreate ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setComposeOpen(true)}>
                From bills
              </Button>
              <Button type="button" size="sm" asChild>
                <Link href="/landed-costs/new">
                  <Plus className="size-4" />
                  New
                </Link>
              </Button>
            </div>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch value={search ?? ""} onChange={(value) => setParams({ search: value })} />
        <FilterSelect
          className="w-40"
          placeholder="Status"
          aria-label="Filter by status"
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
        <DateRangeFilter
          layout="inline"
          fromId="lc-from"
          toId="lc-to"
          from={filters.document_date_from ?? ""}
          to={filters.document_date_to ?? ""}
          onFromChange={(value) => setParams({ filters: { document_date_from: value || null } })}
          onToChange={(value) => setParams({ filters: { document_date_to: value || null } })}
        />
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <SortableHeads
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {listQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : listQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(listQuery.error)}
                  onRetry={() => listQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No landed costs"
                  message={emptyListMessage(canCreate, "Create a landed cost from a posted expense bill.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = landedCostDisplayNumber(row);
              const href = `/landed-costs/${row.id}`;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <RecordLink href={href}>{number ?? "Draft"}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>{LANDED_COST_ALLOCATION_METHOD_LABELS[row.allocation_method]}</TableCell>
                  <TableCell>{formatDecimal(row.total_charges)}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={row.status}
                      labels={STOCK_DOCUMENT_STATUS_LABELS}
                      variants={STOCK_DOCUMENT_STATUS_VARIANTS}
                    />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "landed cost"}
                        viewHref={canRead ? href : undefined}
                        editHref={
                          canUpdate && row.status === "DRAFT" ? `${href}/edit` : undefined
                        }
                        onDelete={
                          canDelete && row.available_actions.includes("delete")
                            ? () => setDeleting(row)
                            : undefined
                        }
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
      <ComposeFromBillsDialog open={composeOpen} onOpenChange={setComposeOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title={`${getDocumentAction(LANDED_COST_ACTION_REGISTRY, "delete").label} landed cost ${deleting ? (landedCostDisplayNumber(deleting) ?? "landed cost") : "landed cost"}`}
        description={
          deleting
            ? getDocumentAction(LANDED_COST_ACTION_REGISTRY, "delete").confirmCopy?.(
                landedCostDisplayNumber(deleting) ?? "landed cost",
              )
            : undefined
        }
        confirmLabel="Delete"
        pending={deleteDocument.isPending}
        onConfirm={() => {
          if (!deleting) {
            return;
          }
          void (async () => {
            try {
              await deleteDocument.mutateAsync({ id: deleting.id, version: deleting.version });
              toast.success("Landed cost deleted");
              setDeleting(null);
            } catch (error) {
              toast.error(getErrorMessage(error));
            }
          })();
        }}
      />
    </ListPage>
  );
}
