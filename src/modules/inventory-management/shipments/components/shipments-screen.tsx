"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useDeleteShipment } from "@/modules/inventory-management/shipments/mutations";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { useShipments } from "@/modules/inventory-management/shipments/queries";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_VARIANTS,
  SHIPMENT_STATUSES,
  SHIPMENT_TYPE_LABELS,
  SHIPMENT_TYPES,
  TRANSPORT_MODE_LABELS,
  INCOTERM_LABELS,
  parseShipmentStatus,
  parseShipmentType,
  shipmentDisplayNumber,
  type Shipment,
} from "@/modules/inventory-management/shipments/schemas";
import { SHIPMENT_ACTION_REGISTRY } from "@/modules/inventory-management/shipments/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
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

export function ShipmentsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(shipmentPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const shipmentsQuery = useShipments({
    page,
    page_size,
    search,
    status: parseShipmentStatus(filters.status),
    shipment_type: parseShipmentType(filters.shipment_type),
  });
  const deleteShipment = useDeleteShipment();
  const [deleting, setDeleting] = useState<Shipment | null>(null);
  const rows = shipmentsQuery.data?.data ?? [];
  const meta = shipmentsQuery.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Shipment>> => {
    return [
      {
        id: "document_number",
        header: "Number",
        className: "font-mono text-sm",
        cell: (row) => (
          <RecordLink href={`/shipments/${row.id}`}>{shipmentDisplayNumber(row) ?? "—"}</RecordLink>
        ),
      },
      {
        id: "shipment_type",
        header: "Type",
        cell: (row) => SHIPMENT_TYPE_LABELS[row.shipment_type],
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <DocumentStatusBadge
            status={row.status}
            labels={SHIPMENT_STATUS_LABELS}
            variants={SHIPMENT_STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "transport_mode",
        header: "Transport",
        defaultVisible: false,
        cell: (row) => TRANSPORT_MODE_LABELS[row.transport_mode],
      },
      {
        id: "incoterm",
        header: "Incoterm",
        defaultVisible: false,
        cell: (row) => (row.incoterm ? INCOTERM_LABELS[row.incoterm] : "—"),
      },
      {
        id: "carrier_name",
        header: "Carrier",
        defaultVisible: false,
        cell: (row) => row.carrier_name || "—",
      },
      {
        id: "etd",
        header: "ETD",
        defaultVisible: false,
        cell: (row) => formatDate(row.etd),
      },
      {
        id: "eta",
        header: "ETA",
        defaultVisible: false,
        cell: (row) => formatDate(row.eta),
      },
      {
        id: "total_packages",
        header: "Packages",
        defaultVisible: false,
        cell: (row) => row.total_packages ?? "—",
      },
      {
        id: "gross_weight",
        header: "Gross kg",
        defaultVisible: false,
        cell: (row) => row.gross_weight ?? "—",
      },
      {
        id: "total_cbm",
        header: "CBM",
        defaultVisible: false,
        cell: (row) => row.total_cbm ?? "—",
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "max-w-xs truncate",
        cell: (row) => row.notes || "—",
      },
      ...auditTimestampColumns<Shipment>(),
      ...auditActorColumns<Shipment>(userNameById),
      ...actionsColumn<Shipment>(showActions, (row) => {
        const number = shipmentDisplayNumber(row);
        return (
          <DataTableRowActions
            entityName={number}
            viewHref={canRead ? `/shipments/${row.id}` : undefined}
            editHref={canUpdate && row.status === "DRAFT" ? `/shipments/${row.id}/edit` : undefined}
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

  const { columns, columnsDialog, colSpan } = useTableColumns("logistics.shipments", columnDefs);

  async function onDelete() {
    if (!deleting) return;
    try {
      await deleteShipment.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Shipment deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Shipments"
        subtitle="Export logistics tracking. Stock already moved on the delivery note."
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/shipments/new">
                <Plus className="size-3.5" />
                New shipment
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search number, container, BL, carrier…"
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
            ...SHIPMENT_STATUSES.map((status) => ({
              value: status,
              label: SHIPMENT_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
          label="Type"
          className="w-40"
          placeholder="Type"
          value={filters.shipment_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { shipment_type: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All types" },
            ...SHIPMENT_TYPES.map((type) => ({
              value: type,
              label: SHIPMENT_TYPE_LABELS[type],
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
          {shipmentsQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : shipmentsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(shipmentsQuery.error)}
                  onRetry={() => shipmentsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No shipments"
                  message={emptyListMessage(canCreate, "Create a shipment to track a consignment.")}
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
        title={`Delete shipment ${deleting ? (shipmentDisplayNumber(deleting) ?? "shipment") : ""}`}
        description={
          deleting
            ? (getDocumentAction(SHIPMENT_ACTION_REGISTRY, "delete").confirmCopy?.(
                shipmentDisplayNumber(deleting) ?? "shipment",
              ) ?? "")
            : ""
        }
        confirmLabel="Delete"
        pending={deleteShipment.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={() => void onDelete()}
      />
    </ListPage>
  );
}
