"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useDeletePurchaseReturn } from "@/modules/inventory-management/purchase-returns/mutations";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { usePurchaseReturns } from "@/modules/inventory-management/purchase-returns/queries";
import {
  PURCHASE_RETURN_REASON_LABELS,
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  purchaseReturnDisplayNumber,
  type PurchaseReturn,
  type StockDocumentStatus,
} from "@/modules/inventory-management/purchase-returns/schemas";
import { PURCHASE_RETURN_ACTION_REGISTRY } from "@/modules/inventory-management/purchase-returns/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
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
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Date", "Reason", "Status"] as const;
const ALL = "all";

function parseStatus(value: string | undefined): StockDocumentStatus | undefined {
  return STOCK_DOCUMENT_STATUSES.includes(value as StockDocumentStatus)
    ? (value as StockDocumentStatus)
    : undefined;
}

export function PurchaseReturnsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(purchaseReturnPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const returnsQuery = usePurchaseReturns({
    page,
    page_size,
    search,
    status: parseStatus(filters.status),
  });
  const deleteReturn = useDeletePurchaseReturn();
  const [deleting, setDeleting] = useState<PurchaseReturn | null>(null);
  const rows = returnsQuery.data?.data ?? [];
  const meta = returnsQuery.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onDelete() {
    if (!deleting) return;
    try {
      await deleteReturn.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Purchase return deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Purchase returns"
        subtitle="Return goods against a posted goods receipt"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/purchase-returns/new">
                <Plus className="size-3.5" />
                New purchase return
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search purchase returns…"
        />
        <FilterSelect
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
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header} className="font-medium">
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {returnsQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : returnsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(returnsQuery.error)}
                  onRetry={() => returnsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No purchase returns"
                  message={emptyListMessage(canCreate, "Create a purchase return from a posted goods receipt.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = purchaseReturnDisplayNumber(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/purchase-returns/${row.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>{PURCHASE_RETURN_REASON_LABELS[row.reason_code]}</TableCell>
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
                        entityName={number ?? "purchase return"}
                        viewHref={canRead ? `/purchase-returns/${row.id}` : undefined}
                        editHref={
                          canUpdate && row.status === "DRAFT"
                            ? `/purchase-returns/${row.id}/edit`
                            : undefined
                        }
                        onDelete={
                          row.available_actions.includes("delete") && canDelete
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
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={`Delete purchase return ${deleting ? (purchaseReturnDisplayNumber(deleting) ?? "purchase return") : ""}`}
        description={
          deleting
            ? (getDocumentAction(PURCHASE_RETURN_ACTION_REGISTRY, "delete").confirmCopy?.(
                purchaseReturnDisplayNumber(deleting) ?? "purchase return",
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
