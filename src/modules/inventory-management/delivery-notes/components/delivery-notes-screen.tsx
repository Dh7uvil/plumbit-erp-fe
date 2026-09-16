"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useDeleteDeliveryNote } from "@/modules/inventory-management/delivery-notes/mutations";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { useDeliveryNotes } from "@/modules/inventory-management/delivery-notes/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  deliveryNoteDisplayNumber,
  type DeliveryNote,
  type StockDocumentStatus,
} from "@/modules/inventory-management/delivery-notes/schemas";
import { DELIVERY_NOTE_ACTION_REGISTRY } from "@/modules/inventory-management/delivery-notes/workflow";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
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
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
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

const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "document_date", label: "Date" },
  { value: "status", label: "Status" },
] as const;
const ALL = "all";
const EMPTY_EXTRA = {
  warehouseId: ALL,
  unshipped: ALL,
  documentDateFrom: "",
  documentDateTo: "",
};

function parseStatus(value: string | undefined): StockDocumentStatus | undefined {
  return STOCK_DOCUMENT_STATUSES.includes(value as StockDocumentStatus)
    ? (value as StockDocumentStatus)
    : undefined;
}

export function DeliveryNotesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(deliveryNotePermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    warehouseId: filters.warehouse_id ?? ALL,
    unshipped: filters.unshipped ?? ALL,
    documentDateFrom: filters.document_date_from ?? "",
    documentDateTo: filters.document_date_to ?? "",
  };
  const extraCount = [
    extraFilters.warehouseId !== ALL,
    extraFilters.unshipped !== ALL,
    extraFilters.documentDateFrom !== "",
    extraFilters.documentDateTo !== "",
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const notesQuery = useDeliveryNotes({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    customer_id: filters.customer_id,
    warehouse_id: filters.warehouse_id,
    unshipped: filters.unshipped === "true" ? true : undefined,
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });
  const customersQuery = useAllCustomers();
  const warehousesQuery = useAllWarehouses();
  const deleteNote = useDeleteDeliveryNote();
  const [deleting, setDeleting] = useState<DeliveryNote | null>(null);
  const rows = notesQuery.data?.data ?? [];
  const meta = notesQuery.data?.meta;
  const customers = customersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const customerLabelById = new Map(customers.map((customer) => [customer.id, customer.name]));
  const userNameById = useUserNameMap();
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);

  const columnDefs = useMemo((): Array<DataTableColumn<DeliveryNote>> => {
    return [
      {
        id: "document_number",
        header: "Number",
        sortableField: "document_number",
        className: "font-mono text-sm",
        cell: (row) => (
          <RecordLink href={`/delivery-notes/${row.id}`}>
            {deliveryNoteDisplayNumber(row) ?? "—"}
          </RecordLink>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        cell: (row) => customerLabelById.get(row.customer_id) ?? "—",
      },
      {
        id: "document_date",
        header: "Date",
        sortableField: "document_date",
        cell: (row) => formatDate(row.document_date),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
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
        id: "warehouse",
        header: "Warehouse",
        defaultVisible: false,
        cell: (row) =>
          (warehousesQuery.data ?? []).find((warehouse) => warehouse.id === row.warehouse_id)
            ?.name ?? "—",
      },
      {
        id: "vehicle_number",
        header: "Vehicle",
        defaultVisible: false,
        cell: (row) => row.vehicle_number || "—",
      },
      {
        id: "driver_name",
        header: "Driver",
        defaultVisible: false,
        cell: (row) => row.driver_name || "—",
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "max-w-xs truncate",
        cell: (row) => row.notes || "—",
      },
      ...auditTimestampColumns<DeliveryNote>(),
      ...auditActorColumns<DeliveryNote>(userNameById),
      ...actionsColumn<DeliveryNote>(showActions, (row) => {
        const number = deliveryNoteDisplayNumber(row);
        return (
          <DataTableRowActions
            entityName={number}
            viewHref={canRead ? `/delivery-notes/${row.id}` : undefined}
            editHref={
              canUpdate && row.status === "DRAFT"
                ? `/delivery-notes/${row.id}/edit`
                : undefined
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
  }, [canDelete, canRead, canUpdate, customerLabelById, showActions, userNameById, warehousesQuery.data]);

  const { columns, columnsDialog, colSpan } = useTableColumns(
    "inventory.delivery_notes",
    columnDefs,
  );

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteNote.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Delivery note deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Delivery notes"
        subtitle="Dispatch sales orders and consume reserved stock"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/delivery-notes/new">
                <Plus className="size-3.5" />
                New delivery note
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search number, customer, vehicle…"
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
        <FilterSelect
          label="Customer"
          className="w-48"
          placeholder="Customer"
          value={filters.customer_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { customer_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All customers" },
            ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={[
            draftExtra.warehouseId !== ALL,
            draftExtra.unshipped !== ALL,
            draftExtra.documentDateFrom !== "",
            draftExtra.documentDateTo !== "",
          ].filter(Boolean).length}
          description="Filter by warehouse, unshipped notes, and document date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                warehouse_id: draftExtra.warehouseId === ALL ? null : draftExtra.warehouseId,
                unshipped: draftExtra.unshipped === ALL ? null : draftExtra.unshipped,
                document_date_from:
                  draftExtra.documentDateFrom === "" ? null : draftExtra.documentDateFrom,
                document_date_to:
                  draftExtra.documentDateTo === "" ? null : draftExtra.documentDateTo,
              },
            })
          }
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <FilterField label="Warehouse" htmlFor="dn-filter-warehouse">
            <FilterSelect
              id="dn-filter-warehouse"
              className="w-full"
              placeholder="Warehouse"
              value={draftExtra.warehouseId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, warehouseId: value }))
              }
              options={[
                { value: ALL, label: "All warehouses" },
                ...warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: `${warehouse.code} — ${warehouse.name}`,
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Unshipped" htmlFor="dn-filter-unshipped">
            <FilterSelect
              id="dn-filter-unshipped"
              className="w-full"
              placeholder="Unshipped"
              value={draftExtra.unshipped}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, unshipped: value }))
              }
              options={[
                { value: ALL, label: "All notes" },
                { value: "true", label: "Unshipped only" },
              ]}
            />
          </FilterField>
          <DateRangeFilter
            fromId="dn-filter-from"
            toId="dn-filter-to"
            from={draftExtra.documentDateFrom}
            to={draftExtra.documentDateTo}
            onFromChange={(value) =>
              setDraftExtra((current) => ({ ...current, documentDateFrom: value }))
            }
            onToChange={(value) =>
              setDraftExtra((current) => ({ ...current, documentDateTo: value }))
            }
          />
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.status || filters.customer_id || extraCount > 0 || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: {
                  status: null,
                  customer_id: null,
                  warehouse_id: null,
                  unshipped: null,
                  document_date_from: null,
                  document_date_to: null,
                },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads
              columns={columns}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {notesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : notesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(notesQuery.error)}
                  onRetry={() => notesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No delivery notes"
                  message={emptyListMessage(canCreate, "Create a delivery note to get started.")}
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
        title={`${getDocumentAction(DELIVERY_NOTE_ACTION_REGISTRY, "delete").label} delivery note ${deleting ? (deliveryNoteDisplayNumber(deleting) ?? "delivery note") : "delivery note"}`}
        description={
          deleting
            ? (getDocumentAction(DELIVERY_NOTE_ACTION_REGISTRY, "delete").confirmCopy?.(
                deliveryNoteDisplayNumber(deleting) ?? "delivery note",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(DELIVERY_NOTE_ACTION_REGISTRY, "delete").label}
        pending={deleteNote.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={() => void onDelete()}
      />
    </ListPage>
  );
}
