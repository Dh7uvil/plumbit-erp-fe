"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
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
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import { useCan } from "@/shared/providers/session-provider";

const HEADERS = ["SKU", "Name", "Type", "Rate", "Status", "Actions"] as const;
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
  const can = useCan();
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
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Products"
        subtitle="Sellable goods and services"
        actions={
          can(productPermissions.create) ? (
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
        <Select
          value={filters.item_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { item_type: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {ITEM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {ITEM_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.category_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { category_id: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.is_active ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_active: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {productsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : productsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(productsQuery.error)}
                  onRetry={() => productsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty title="No products" message="Create a product to get started." />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell className="font-medium">
                  <Link href={`/products/${product.id}`} className="hover:underline">
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>{ITEM_TYPE_LABELS[product.item_type]}</TableCell>
                <TableCell>
                  {displayCurrency ? formatMoney(product.selling_rate, displayCurrency.code) : "—"}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={product.is_active} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(productPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${product.name}`}
                        asChild
                      >
                        <Link href={`/products/${product.id}`}>
                          <Edit2 className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    {can(productPermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => setDeleting(product)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
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
    </div>
  );
}
