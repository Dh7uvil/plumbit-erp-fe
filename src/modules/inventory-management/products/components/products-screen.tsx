"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import { ProductFormDialog } from "@/modules/inventory-management/products/components/product-form-dialog";
import { useDeleteProduct } from "@/modules/inventory-management/products/mutations";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useProducts } from "@/modules/inventory-management/products/queries";
import {
  ITEM_TYPE_LABELS,
  ITEM_TYPES,
  type ItemType,
  type Product,
} from "@/modules/inventory-management/products/schemas";
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
import { formatMoney } from "@/shared/lib/format";

const COLUMN_HEADERS = ["SKU", "Name", "Type", "Rate", "Status"] as const;
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

function parseItemType(value: string | undefined): ItemType | undefined {
  return ITEM_TYPES.includes(value as ItemType) ? (value as ItemType) : undefined;
}

export function ProductsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(productPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const productsQuery = useProducts({
    page,
    page_size,
    search,
    item_type: parseItemType(filters.item_type),
    is_active: parseBoolFilter(filters.is_active),
    category_id: filters.category_id,
  });
  const categoriesQuery = useAllCategories();
  const currenciesQuery = useAllCurrencies();
  const deleteProduct = useDeleteProduct();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const rows = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const categories = categoriesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const displayCurrency = currencies.find((currency) => currency.is_base) ?? currencies[0];
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteProduct.mutateAsync(deleting.id);
      toast.success("Product deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Products"
        subtitle="Sellable goods and services"
        actions={
          canCreate ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setFormOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New Product
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search products…"
        />
        <FilterSelect
          className="w-36"
          placeholder="Type"
          value={filters.item_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { item_type: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All types" },
            ...ITEM_TYPES.map((type) => ({ value: type, label: ITEM_TYPE_LABELS[type] })),
          ]}
        />
        <FilterSelect
          className="w-44"
          placeholder="Category"
          value={filters.category_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { category_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All categories" },
            ...categories.map((category) => ({ value: category.id, label: category.name })),
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
          {productsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : productsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(productsQuery.error)}
                  onRetry={() => productsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No products"
                  message={emptyListMessage(canCreate, "Create a product to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/products/${product.id}`}>{product.sku}</RecordLink>
                </TableCell>
                <TableCell className="font-medium">
                  <RecordLink href={`/products/${product.id}`}>{product.name}</RecordLink>
                </TableCell>
                <TableCell>{ITEM_TYPE_LABELS[product.item_type]}</TableCell>
                <TableCell>
                  {displayCurrency ? formatMoney(product.selling_rate, displayCurrency.code) : "—"}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={product.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={product.name}
                      viewHref={canRead ? `/products/${product.id}` : undefined}
                      editHref={canUpdate ? `/products/${product.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(product) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <ProductFormDialog open={formOpen} product={null} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete product"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this product"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteProduct.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
