"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
  parseShipmentStatus,
  parseShipmentType,
  shipmentDisplayNumber,
  type Shipment,
} from "@/modules/inventory-management/shipments/schemas";
import { SHIPMENT_ACTION_REGISTRY } from "@/modules/inventory-management/shipments/workflow";
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

const COLUMN_HEADERS = ["Number", "Type", "Status"] as const;
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
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

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
          placeholder="Search shipments…"
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
            ...SHIPMENT_STATUSES.map((status) => ({
              value: status,
              label: SHIPMENT_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
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
          {shipmentsQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : shipmentsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(shipmentsQuery.error)}
                  onRetry={() => shipmentsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No shipments"
                  message={emptyListMessage(canCreate, "Create a shipment to track a consignment.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = shipmentDisplayNumber(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/shipments/${row.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell>{SHIPMENT_TYPE_LABELS[row.shipment_type]}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={row.status}
                      labels={SHIPMENT_STATUS_LABELS}
                      variants={SHIPMENT_STATUS_VARIANTS}
                    />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "shipment"}
                        viewHref={canRead ? `/shipments/${row.id}` : undefined}
                        editHref={
                          canUpdate && row.status === "DRAFT"
                            ? `/shipments/${row.id}/edit`
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
