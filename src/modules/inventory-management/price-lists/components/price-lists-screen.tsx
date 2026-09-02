"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { PriceListFormDialog } from "@/modules/inventory-management/price-lists/components/price-list-form-dialog";
import { useDeletePriceList } from "@/modules/inventory-management/price-lists/mutations";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { usePriceLists } from "@/modules/inventory-management/price-lists/queries";
import {
  PRICE_LIST_TYPE_LABELS,
  PRICE_LIST_TYPES,
  type PriceList,
  type PriceListType,
} from "@/modules/inventory-management/price-lists/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["Name", "Type", "Currency", "Percent", "Status"] as const;
const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "list_type", label: "Type" },
  { value: "is_active", label: "Status" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Name: "name",
  Type: "list_type",
  Status: "is_active",
};
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

function parseListType(value: string | undefined): PriceListType | undefined {
  return PRICE_LIST_TYPES.includes(value as PriceListType) ? (value as PriceListType) : undefined;
}

export function PriceListsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(priceListPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraCurrency = filters.currency_id ?? ALL;
  const extraCount = extraCurrency !== ALL ? 1 : 0;
  const [draftCurrency, setDraftCurrency] = useState(ALL);
  const priceListsQuery = usePriceLists({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
    list_type: parseListType(filters.list_type),
    currency_id: filters.currency_id,
  });
  const currenciesQuery = useAllCurrencies();
  const deletePriceList = useDeletePriceList();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<PriceList | null>(null);

  const rows = priceListsQuery.data?.data ?? [];
  const meta = priceListsQuery.data?.meta;
  const currencyLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const currency of currenciesQuery.data ?? []) {
      map.set(currency.id, currency.code);
    }
    return map;
  }, [currenciesQuery.data]);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deletePriceList.mutateAsync(deleting.id);
      toast.success("Price list deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Price lists"
        subtitle="Customer and item rate charts"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New Price List
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search price lists…"
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
        <FilterSelect
          className="w-40"
          placeholder="Type"
          value={filters.list_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { list_type: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All types" },
            ...PRICE_LIST_TYPES.map((type) => ({
              value: type,
              label: PRICE_LIST_TYPE_LABELS[type],
            })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={draftCurrency !== ALL ? 1 : 0}
          description="Filter by currency."
          onOpen={() => setDraftCurrency(extraCurrency)}
          onApply={() =>
            setParams({ filters: { currency_id: draftCurrency === ALL ? null : draftCurrency } })
          }
          onClearDraft={() => setDraftCurrency(ALL)}
        >
          <FilterField label="Currency" htmlFor="price-list-filter-currency">
            <FilterSelect
              id="price-list-filter-currency"
              className="w-full"
              placeholder="Currency"
              value={draftCurrency}
              onValueChange={setDraftCurrency}
              options={[
                { value: ALL, label: "All currencies" },
                ...(currenciesQuery.data ?? []).map((currency) => ({
                  value: currency.id,
                  label: currency.code,
                })),
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
        {search || filters.is_active || filters.list_type || extraCount > 0 || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null, list_type: null, currency_id: null },
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
            <SortableHeads
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {priceListsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : priceListsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(priceListsQuery.error)}
                  onRetry={() => priceListsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No price lists"
                  message={emptyListMessage(canCreate, "Create a price list to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((priceList) => (
              <TableRow key={priceList.id}>
                <TableCell className="font-medium">
                  <RecordLink href={`/price-lists/${priceList.id}`}>{priceList.name}</RecordLink>
                </TableCell>
                <TableCell>
                  <RecordLink href={`/price-lists/${priceList.id}`}>
                    {PRICE_LIST_TYPE_LABELS[priceList.list_type]}
                  </RecordLink>
                </TableCell>
                <TableCell>{currencyLabelById.get(priceList.currency_id) ?? "—"}</TableCell>
                <TableCell>{priceList.percent ?? "—"}</TableCell>
                <TableCell>
                  <ActiveBadge active={priceList.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={priceList.name}
                      viewHref={canRead ? `/price-lists/${priceList.id}` : undefined}
                      editHref={canUpdate ? `/price-lists/${priceList.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(priceList) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <PriceListFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete price list"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this price list"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deletePriceList.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
