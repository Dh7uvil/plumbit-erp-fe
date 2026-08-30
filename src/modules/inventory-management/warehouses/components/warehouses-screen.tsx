"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { WarehouseFormDialog } from "@/modules/inventory-management/warehouses/components/warehouse-form-dialog";
import { useDeleteWarehouse } from "@/modules/inventory-management/warehouses/mutations";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { useWarehouses } from "@/modules/inventory-management/warehouses/queries";
import type { Warehouse } from "@/modules/inventory-management/warehouses/schemas";
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
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
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

const COLUMN_HEADERS = ["Code", "Name", "Phone", "Default", "Status"] as const;
const ALL = "all";

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

export function WarehousesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(warehousePermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const warehousesQuery = useWarehouses({
    page,
    page_size,
    search,
    is_active: parseBoolFilter(filters.is_active),
    is_default: parseBoolFilter(filters.is_default),
  });
  const deleteWarehouse = useDeleteWarehouse();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = warehousesQuery.data?.data ?? [];
  const meta = warehousesQuery.data?.meta;

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteWarehouse.mutateAsync(deleting.id);
      toast.success("Warehouse deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Warehouses"
        subtitle="Inventory locations for the tenant"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Warehouse
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search warehouses…"
        />
        <FilterSelect
          className="w-36"
          placeholder="Default"
          value={filters.is_default ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_default: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All" },
            { value: "true", label: "Default" },
            { value: "false", label: "Non-default" },
          ]}
        />
        <FilterSelect
          className="w-36"
          placeholder="Status"
          value={filters.is_active ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_active: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehousesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : warehousesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(warehousesQuery.error)}
                  onRetry={() => warehousesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No warehouses"
                  message={emptyListMessage(canCreate, "Create a warehouse to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/warehouses/${warehouse.id}`}>{warehouse.code}</RecordLink>
                </TableCell>
                <TableCell className="font-medium">
                  <RecordLink href={`/warehouses/${warehouse.id}`}>{warehouse.name}</RecordLink>
                </TableCell>
                <TableCell>{warehouse.phone || "—"}</TableCell>
                <TableCell>
                  {warehouse.is_default ? <Badge variant="info">Default</Badge> : "—"}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={warehouse.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={warehouse.name}
                      viewHref={canRead ? `/warehouses/${warehouse.id}` : undefined}
                      editHref={canUpdate ? `/warehouses/${warehouse.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(warehouse) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <WarehouseFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete warehouse"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this warehouse"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteWarehouse.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
