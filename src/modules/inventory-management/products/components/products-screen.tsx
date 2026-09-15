"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
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
import { useAllUnits } from "@/modules/inventory-management/units/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
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
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ImexToolbar } from "@/shared/components/imex/imex-toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";
import { formatMoney } from "@/shared/lib/format";

const SORT_FIELDS = [
  { value: "sku", label: "SKU" },
  { value: "name", label: "Name" },
  { value: "item_type", label: "Type" },
  { value: "selling_rate", label: "Rate" },
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

function parseItemType(value: string | undefined): ItemType | undefined {
  return ITEM_TYPES.includes(value as ItemType) ? (value as ItemType) : undefined;
}

export function ProductsScreen() {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(productPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraCategory = filters.category_id ?? ALL;
  const extraUnit = filters.unit_id ?? ALL;
  const extraTax = filters.tax_id ?? ALL;
  const extraCount = [extraCategory, extraUnit, extraTax].filter((value) => value !== ALL).length;
  const [draftCategory, setDraftCategory] = useState(ALL);
  const [draftUnit, setDraftUnit] = useState(ALL);
  const [draftTax, setDraftTax] = useState(ALL);
  const productsQuery = useProducts({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    item_type: parseItemType(filters.item_type),
    is_active: parseBoolFilter(filters.is_active),
    category_id: filters.category_id,
    unit_id: filters.unit_id,
    tax_id: filters.tax_id,
  });
  const categoriesQuery = useAllCategories();
  const unitsQuery = useAllUnits();
  const taxesQuery = useAllTaxes();
  const currenciesQuery = useAllCurrencies();
  const deleteProduct = useDeleteProduct();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const rows = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const categories = categoriesQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const taxes = taxesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const displayCurrency = currencies.find((currency) => currency.is_base) ?? currencies[0];
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Product>> => {
    return [
      {
        id: "sku",
        header: "SKU",
        sortableField: "sku",
        className: "font-mono text-sm",
        cell: (product) => <RecordLink href={`/products/${product.id}`}>{product.sku}</RecordLink>,
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (product) => (
          <RecordLink href={`/products/${product.id}`} className="block truncate">
            {product.name}
          </RecordLink>
        ),
      },
      {
        id: "item_type",
        header: "Type",
        sortableField: "item_type",
        cell: (product) => ITEM_TYPE_LABELS[product.item_type],
      },
      {
        id: "selling_rate",
        header: "Rate",
        sortableField: "selling_rate",
        cell: (product) =>
          displayCurrency
            ? formatMoney(
                product.selling_rate,
                displayCurrency.code,
                displayCurrency.decimal_places,
              )
            : "—",
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (product) => <ActiveBadge active={product.is_active} />,
      },
      {
        id: "category",
        header: "Category",
        defaultVisible: false,
        cell: (product) =>
          (categoriesQuery.data ?? []).find((category) => category.id === product.category_id)
            ?.name ?? "—",
      },
      {
        id: "unit",
        header: "Unit",
        defaultVisible: false,
        cell: (product) =>
          (unitsQuery.data ?? []).find((unit) => unit.id === product.unit_id)?.name ?? "—",
      },
      {
        id: "hs_code",
        header: "HS code",
        defaultVisible: false,
        className: "font-mono text-xs",
        cell: (product) => product.hs_code || "—",
      },
      {
        id: "sales_description",
        header: "Sales description",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (product) => product.sales_description || "—",
      },
      {
        id: "purchase_rate",
        header: "Purchase rate",
        defaultVisible: false,
        cell: (product) =>
          displayCurrency
            ? formatMoney(
                product.purchase_rate,
                displayCurrency.code,
                displayCurrency.decimal_places,
              )
            : "—",
      },
      {
        id: "track_inventory",
        header: "Track inventory",
        defaultVisible: false,
        cell: (product) => (product.track_inventory ? "Yes" : "No"),
      },
      {
        id: "requires_qc",
        header: "Requires QC",
        defaultVisible: false,
        cell: (product) => (product.requires_qc ? "Yes" : "No"),
      },
      {
        id: "tax",
        header: "Tax",
        defaultVisible: false,
        cell: (product) =>
          (taxesQuery.data ?? []).find((tax) => tax.id === product.tax_id)?.name ?? "—",
      },
      ...auditTimestampColumns<Product>(),
      ...auditActorColumns<Product>(userNameById),
      ...actionsColumn<Product>(showActions, (product) => (
        <DataTableRowActions
          entityName={product.name}
          viewHref={canRead ? `/products/${product.id}` : undefined}
          editHref={canUpdate ? `/products/${product.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(product) : undefined}
        />
      )),
    ];
  }, [
    canDelete,
    canRead,
    canUpdate,
    categoriesQuery.data,
    displayCurrency,
    showActions,
    taxesQuery.data,
    unitsQuery.data,
    userNameById,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.products", columnDefs);

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
          <div className="flex flex-wrap items-center gap-2">
            <ImexToolbar
              resource="products"
              title="products"
              canImport={can(productPermissions.import) || canCreate}
              canExport={can(productPermissions.export) || canRead}
              exportParams={{
                search,
                item_type: filters.item_type,
                category_id: filters.category_id,
                unit_id: filters.unit_id,
                tax_id: filters.tax_id,
              }}
              onImported={() => {
                void productsQuery.refetch();
              }}
            />
            {canCreate ? (
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
            ) : null}
          </div>
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search SKU, name, HS code…"
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
          label="Type"
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
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={[draftCategory, draftUnit, draftTax].filter((value) => value !== ALL).length}
          description="Filter by category, unit, or tax."
          onOpen={() => {
            setDraftCategory(extraCategory);
            setDraftUnit(extraUnit);
            setDraftTax(extraTax);
          }}
          onApply={() =>
            setParams({
              filters: {
                category_id: draftCategory === ALL ? null : draftCategory,
                unit_id: draftUnit === ALL ? null : draftUnit,
                tax_id: draftTax === ALL ? null : draftTax,
              },
            })
          }
          onClearDraft={() => {
            setDraftCategory(ALL);
            setDraftUnit(ALL);
            setDraftTax(ALL);
          }}
        >
          <FilterField label="Category" htmlFor="product-filter-category">
            <FilterSelect
              id="product-filter-category"
              className="w-full"
              placeholder="Category"
              value={draftCategory}
              onValueChange={setDraftCategory}
              options={[
                { value: ALL, label: "All categories" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </FilterField>
          <FilterField label="Unit" htmlFor="product-filter-unit">
            <FilterSelect
              id="product-filter-unit"
              className="w-full"
              placeholder="Unit"
              value={draftUnit}
              onValueChange={setDraftUnit}
              options={[
                { value: ALL, label: "All units" },
                ...units.map((unit) => ({ value: unit.id, label: `${unit.code} · ${unit.name}` })),
              ]}
            />
          </FilterField>
          <FilterField label="Tax" htmlFor="product-filter-tax">
            <FilterSelect
              id="product-filter-tax"
              className="w-full"
              placeholder="Tax"
              value={draftTax}
              onValueChange={setDraftTax}
              options={[
                { value: ALL, label: "All taxes" },
                ...taxes.map((tax) => ({ value: tax.id, label: tax.name })),
              ]}
            />
          </FilterField>
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.is_active || filters.item_type || extraCount > 0 || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null, item_type: null, category_id: null, unit_id: null, tax_id: null },
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
          {productsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : productsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(productsQuery.error)}
                  onRetry={() => productsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No products"
                  message={emptyListMessage(canCreate, "Create a product to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((product) => (
              <TableRow key={product.id}>
                <DataTableCells columns={columns} row={product} />
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
