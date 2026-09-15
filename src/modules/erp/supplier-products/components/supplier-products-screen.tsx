"use client";

import { Link2, Plus, Unlink } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { LinkProductDialog } from "@/modules/erp/supplier-products/components/link-product-dialog";
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
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDateTime, formatMoney } from "@/shared/lib/format";
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

function MappedProductCell({ row }: { row: SupplierProduct }) {
  if (!row.is_mapped || !row.product_id) {
    return <Badge variant="warning">Unmapped</Badge>;
  }
  return (
    <RecordLink href={`/products/${row.product_id}`}>
      {row.product_sku ? `${row.product_sku} — ${row.product_name}` : (row.product_name ?? "—")}
    </RecordLink>
  );
}

function PreferredBadges({ row }: { row: SupplierProduct }) {
  if (!row.is_preferred && !row.is_preferred_supplier) {
    return "—";
  }
  return (
    <div className="flex flex-wrap gap-1">
      {row.is_preferred ? <Badge variant="info">Preferred SKU</Badge> : null}
      {row.is_preferred_supplier ? <Badge variant="info">Preferred supplier</Badge> : null}
    </div>
  );
}

export function SupplierProductsScreen() {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(
    supplierProductPermissions,
  );
  const canLink = can(supplierProductPermissions.link);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const catalogQuery = useSupplierProducts({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    supplier_id: filters.supplier_id,
    mapped: parseBoolFilter(filters.mapped),
    is_active: parseBoolFilter(filters.is_active),
  });
  const suppliersQuery = useAllSuppliers();
  const deleteRow = useDeleteSupplierProduct();
  const unlinkRow = useUnlinkSupplierProduct();
  const [formOpen, setFormOpen] = useState(false);
  const [linking, setLinking] = useState<SupplierProduct | null>(null);
  const [deleting, setDeleting] = useState<SupplierProduct | null>(null);
  const [unlinking, setUnlinking] = useState<SupplierProduct | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canLink);
  const rows = catalogQuery.data?.data ?? [];
  const meta = catalogQuery.data?.meta;
  const suppliers = suppliersQuery.data ?? [];
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<SupplierProduct>> => {
    return [
      {
        id: "supplier_sku",
        header: "Supplier SKU",
        sortableField: "supplier_sku",
        className: "font-mono text-sm",
        cell: (row) => (
          <RecordLink href={`/supplier-products/${row.id}`}>{row.supplier_sku}</RecordLink>
        ),
      },
      {
        id: "supplier_item",
        header: "Supplier item",
        sortableField: "supplier_item_name",
        cell: (row) => (
          <RecordLink href={`/supplier-products/${row.id}`}>{row.supplier_item_name}</RecordLink>
        ),
      },
      {
        id: "supplier",
        header: "Supplier",
        className: "font-medium",
        cell: (row) => (
          <RecordLink href={`/suppliers/${row.supplier_id}`}>{row.supplier_name ?? "—"}</RecordLink>
        ),
      },
      {
        id: "mapped_product",
        header: "Mapped product",
        cell: (row) => <MappedProductCell row={row} />,
      },
      {
        id: "price",
        header: "Price",
        cell: (row) =>
          row.price && row.currency_code ? formatMoney(row.price, row.currency_code) : "—",
      },
      {
        id: "is_preferred",
        header: "Preferred",
        cell: (row) => <PreferredBadges row={row} />,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      {
        id: "currency_code",
        header: "Currency",
        defaultVisible: false,
        cell: (row) => row.currency_code || "—",
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (row) => row.notes || "—",
      },
      {
        id: "price_updated_at",
        header: "Price updated",
        defaultVisible: false,
        className: "text-muted-foreground text-xs",
        cell: (row) => formatDateTime(row.price_updated_at),
      },
      ...auditTimestampColumns<SupplierProduct>(),
      ...auditActorColumns<SupplierProduct>(userNameById),
      ...actionsColumn<SupplierProduct>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.supplier_sku}
          viewHref={canRead ? `/supplier-products/${row.id}` : undefined}
          editHref={canUpdate ? `/supplier-products/${row.id}/edit` : undefined}
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
      )),
    ];
  }, [canDelete, canLink, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.supplier_products", columnDefs);

  function openCreate() {
    setFormOpen(true);
  }

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

  return (
    <ListPage>
      <PageHeader
        title="Supplier catalog"
        subtitle="Map each supplier SKU to your products"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New catalog item
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search SKU, product, supplier…"
        />
        <FilterSelect
          label="Mapped"
          className="w-40"
          placeholder="Mapped"
          value={filters.mapped ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { mapped: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All mappings" },
            { value: "true", label: "Mapped" },
            { value: "false", label: "Unmapped" },
          ]}
        />
        <FilterSelect
          label="Supplier"
          className="w-48"
          placeholder="Supplier"
          value={filters.supplier_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { supplier_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All suppliers" },
            ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
          ]}
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
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.mapped || filters.supplier_id || filters.is_active || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { mapped: null, supplier_id: null, is_active: null },
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
          {catalogQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
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
                  message={emptyListMessage(canCreate, "Add a supplier SKU to get started.")}
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
      <SupplierProductFormDialog
        open={formOpen}
        supplierProduct={null}
        onOpenChange={setFormOpen}
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
    </ListPage>
  );
}
