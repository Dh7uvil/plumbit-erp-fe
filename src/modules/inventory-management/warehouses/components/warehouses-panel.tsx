"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { WarehouseFormDialog } from "@/modules/inventory-management/warehouses/components/warehouse-form-dialog";
import { useDeleteWarehouse } from "@/modules/inventory-management/warehouses/mutations";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import type { Warehouse } from "@/modules/inventory-management/warehouses/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
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

const COLUMN_HEADERS = ["Code", "Name", "Phone", "Default", "Status"] as const;

export function WarehousesPanel() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(warehousePermissions);
  const warehousesQuery = useAllWarehouses(canRead);
  const deleteWarehouse = useDeleteWarehouse();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const warehouses = warehousesQuery.data ?? [];

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

  if (!canRead) {
    return (
      <DataTableEmpty
        title="Warehouses are not available"
        message="You do not have permission to view warehouses."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canCreate ? (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            New Warehouse
          </Button>
        ) : null}
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehousesQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
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
          ) : warehouses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No warehouses"
                  message={emptyListMessage(canCreate, "Create a warehouse to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            warehouses.map((warehouse) => (
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
    </div>
  );
}
