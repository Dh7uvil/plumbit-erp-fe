"use client";

import { Link2, Plus, Unlink } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LinkProductDialog } from "@/modules/erp/supplier-products/components/link-product-dialog";
import { supplierProductColumnDefs } from "@/modules/erp/supplier-products/components/supplier-product-columns";
import { SupplierProductFormDialog } from "@/modules/erp/supplier-products/components/supplier-product-form-dialog";
import {
  useDeleteSupplierProduct,
  useUnlinkSupplierProduct,
} from "@/modules/erp/supplier-products/mutations";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { useSupplierProducts } from "@/modules/erp/supplier-products/queries";
import type { SupplierProduct } from "@/modules/erp/supplier-products/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useNestedTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const SORT_FIELDS = [
  { value: "supplier_sku", label: "Supplier SKU" },
  { value: "supplier_item_name", label: "Supplier item" },
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
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

export function SupplierProductsPanel({ supplierId }: { supplierId: string }) {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(
    supplierProductPermissions,
  );
  const canLink = can(supplierProductPermissions.link);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const catalogQuery = useSupplierProducts(
    {
      supplier_id: supplierId,
      page,
      page_size,
      search,
      sort_by,
      sort_order,
      mapped: parseBoolFilter(filters.mapped),
      is_active: parseBoolFilter(filters.is_active),
      is_preferred: parseBoolFilter(filters.is_preferred),
    },
    canRead,
  );
  const deleteRow = useDeleteSupplierProduct();
  const unlinkRow = useUnlinkSupplierProduct();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierProduct | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [linking, setLinking] = useState<SupplierProduct | null>(null);
  const [deleting, setDeleting] = useState<SupplierProduct | null>(null);
  const [unlinking, setUnlinking] = useState<SupplierProduct | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canLink);
  const userNameById = useUserNameMap();
  const rows = catalogQuery.data?.data ?? [];
  const meta = catalogQuery.data?.meta;
  const columnDefs = useMemo(
    () =>
      supplierProductColumnDefs({
        userNameById,
        omit: ["supplier"],
        actions: showActions
          ? (row) => (
              <DataTableRowActions
                entityName={row.supplier_sku}
                onView={
                  canRead
                    ? () => {
                        setEditing(row);
                        setForceReadOnly(true);
                        setFormOpen(true);
                      }
                    : undefined
                }
                onEdit={
                  canUpdate
                    ? () => {
                        setEditing(row);
                        setForceReadOnly(false);
                        setFormOpen(true);
                      }
                    : undefined
                }
                onDelete={canDelete ? () => setDeleting(row) : undefined}
                extra={
                  canLink ? (
                    row.is_mapped ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Unlink ${row.supplier_sku}`}
                        onClick={() => setUnlinking(row)}
                      >
                        <Unlink className="size-3.5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Link ${row.supplier_sku}`}
                        onClick={() => setLinking(row)}
                      >
                        <Link2 className="size-3.5" />
                      </Button>
                    )
                  ) : null
                }
              />
            )
          : undefined,
      }),
    [
      canDelete,
      canLink,
      canRead,
      canUpdate,
      setDeleting,
      setEditing,
      setForceReadOnly,
      setFormOpen,
      setLinking,
      setUnlinking,
      showActions,
      userNameById,
    ],
  );
  const { columns, columnsDialog, colSpan } = useTableColumns("erp.supplier_products", columnDefs);
  const hasQuery = Boolean(
    search || filters.mapped || filters.is_active || filters.is_preferred || sort_by,
  );

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteRow.mutateAsync(deleting.id);
      toast.success("Catalog item deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function confirmUnlink() {
    if (!unlinking) {
      return;
    }
    try {
      await unlinkRow.mutateAsync(unlinking.id);
      toast.success("Product unlinked");
      setUnlinking(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!canRead) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Supplier catalog</CardTitle>
        {canCreate ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setForceReadOnly(false);
              setFormOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New catalog item
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DataTableToolbar>
          <ListSearch
            value={search ?? ""}
            onChange={(value) => setParams({ search: value || null })}
            placeholder="Search SKU or item name…"
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
            label="Mapped"
            className="w-36"
            placeholder="Mapped"
            value={filters.mapped ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { mapped: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All" },
              { value: "true", label: "Mapped" },
              { value: "false", label: "Unmapped" },
            ]}
          />
          <FilterSelect
            label="Preferred"
            className="w-36"
            placeholder="Preferred"
            value={filters.is_preferred ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { is_preferred: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All" },
              { value: "true", label: "Preferred" },
              { value: "false", label: "Other" },
            ]}
          />
          <SortDialog
            fields={[...SORT_FIELDS]}
            sortBy={sort_by}
            sortOrder={sort_order}
            onApply={setParams}
          />
          {columnsDialog}
          {hasQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setParams({
                  search: null,
                  sort_by: null,
                  sort_order: null,
                  filters: { is_active: null, mapped: null, is_preferred: null },
                })
              }
            >
              Clear
            </Button>
          ) : null}
        </DataTableToolbar>
        <DataTable
          variant="embedded"
          footer={
            meta ? (
              <DataTablePagination
                meta={meta}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            ) : null
          }
        >
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
            {catalogQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : catalogQuery.isError ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableError
                    message={getErrorMessage(catalogQuery.error)}
                    onRetry={() => catalogQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty
                    title="No catalog items"
                    message={emptyListMessage(canCreate, "Add what this supplier sells.")}
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
      </CardContent>
      <SupplierProductFormDialog
        open={formOpen}
        supplierProduct={editing}
        defaultSupplierId={supplierId}
        lockSupplier
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setForceReadOnly(false);
          }
        }}
      />
      <LinkProductDialog
        open={Boolean(linking)}
        supplierProduct={linking}
        onOpenChange={(open) => {
          if (!open) {
            setLinking(null);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete catalog item"
        description={`Delete ${deleting ? `"${deleting.supplier_sku}"` : "this catalog item"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteRow.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmActionDialog
        open={Boolean(unlinking)}
        title="Unlink product"
        description={`Unlink ${unlinking ? `"${unlinking.supplier_sku}"` : "this catalog item"} from the mapped product?`}
        confirmLabel="Unlink"
        pending={unlinkRow.isPending}
        onOpenChange={(open) => !open && setUnlinking(null)}
        onConfirm={() => void confirmUnlink()}
      />
    </Card>
  );
}
