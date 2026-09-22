"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { WarehouseFormDialog } from "@/modules/inventory-management/warehouses/components/warehouse-form-dialog";
import { useDeleteWarehouse } from "@/modules/inventory-management/warehouses/mutations";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { useWarehouses } from "@/modules/inventory-management/warehouses/queries";
import type { Warehouse } from "@/modules/inventory-management/warehouses/schemas";
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
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
  { value: "is_default", label: "Default" },
  { value: "is_active", label: "Status" },
] as const;
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
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const warehousesQuery = useWarehouses({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
    is_default: parseBoolFilter(filters.is_default),
  });
  const deleteWarehouse = useDeleteWarehouse();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = warehousesQuery.data?.data ?? [];
  const meta = warehousesQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Warehouse>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        className: "font-mono text-sm",
        cell: (warehouse) => (
          <RecordLink href={`/warehouses/${warehouse.id}`}>{warehouse.code}</RecordLink>
        ),
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (warehouse) => (
          <RecordLink href={`/warehouses/${warehouse.id}`}>{warehouse.name}</RecordLink>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        cell: (warehouse) => warehouse.phone || "—",
      },
      {
        id: "is_default",
        header: "Default",
        sortableField: "is_default",
        cell: (warehouse) => (warehouse.is_default ? <Badge variant="info">Default</Badge> : "—"),
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (warehouse) => <ActiveBadge active={warehouse.is_active} />,
      },
      {
        id: "address",
        header: "Address",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (warehouse) => {
          const address = warehouse.address;
          if (!address) {
            return "—";
          }
          const parts = [
            address.address_line_1,
            address.address_line_2,
            address.city,
            address.state,
            address.country,
            address.postal_code,
          ].filter(Boolean);
          return parts.length ? parts.join(", ") : "—";
        },
      },
      {
        id: "is_designated_zone",
        header: "Designated zone",
        defaultVisible: false,
        cell: (warehouse) => (warehouse.is_designated_zone ? "Yes" : "No"),
      },
      ...auditTimestampColumns<Warehouse>(),
      ...auditActorColumns<Warehouse>(userNameById),
      ...actionsColumn<Warehouse>(showActions, (warehouse) => (
        <DataTableRowActions
          entityName={warehouse.name}
          viewHref={canRead ? `/warehouses/${warehouse.id}` : undefined}
          editHref={canUpdate ? `/warehouses/${warehouse.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(warehouse) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.warehouses", columnDefs);

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
          placeholder="Search code, name, phone, address…"
        />
        <FilterSelect
          label="Status"
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
        <FilterSelect
          label="Default"
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
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.is_active || filters.is_default || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null, is_default: null },
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
          {warehousesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : warehousesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(warehousesQuery.error)}
                  onRetry={() => warehousesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No warehouses"
                  message={emptyListMessage(canCreate, "Create a warehouse to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <DataTableCells columns={columns} row={warehouse} />
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
