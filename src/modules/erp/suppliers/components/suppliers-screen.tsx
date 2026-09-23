"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { useDeleteSupplier } from "@/modules/erp/suppliers/mutations";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useSuppliers } from "@/modules/erp/suppliers/queries";
import {
  COMPANY_TYPE_LABELS,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  type Supplier,
  type TaxTreatment,
} from "@/modules/erp/suppliers/schemas";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { useAllPaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { useAllPriceLists } from "@/modules/inventory-management/price-lists/queries";
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
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ImexToolbar } from "@/shared/components/imex/imex-toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
  { value: "tax_treatment", label: "Tax treatment" },
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

function parseTaxTreatment(value: string | undefined): TaxTreatment | undefined {
  return TAX_TREATMENTS.includes(value as TaxTreatment) ? (value as TaxTreatment) : undefined;
}

function deleteDescription(supplier: Supplier | null): string {
  if (!supplier) {
    return "Delete this supplier? This cannot be undone.";
  }
  if (supplier.company_type === "BOTH") {
    return `Delete "${supplier.name}"? This party will disappear from both Customers and Suppliers. This cannot be undone.`;
  }
  return `Delete "${supplier.name}"? This cannot be undone.`;
}

export function SuppliersScreen() {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(supplierPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraCurrency = filters.currency_id ?? ALL;
  const extraCount = extraCurrency !== ALL ? 1 : 0;
  const [draftCurrency, setDraftCurrency] = useState(ALL);
  const suppliersQuery = useSuppliers({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    tax_treatment: parseTaxTreatment(filters.tax_treatment),
    currency_id: filters.currency_id,
    is_active: parseBoolFilter(filters.is_active),
  });
  const currenciesQuery = useAllCurrencies();
  const { baseCurrencyCode } = useBaseCurrency();
  const paymentTermsQuery = useAllPaymentTerms(can(paymentTermPermissions.read));
  const priceListsQuery = useAllPriceLists(can(priceListPermissions.read));
  const deleteSupplier = useDeleteSupplier();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const rows = suppliersQuery.data?.data ?? [];
  const meta = suppliersQuery.data?.meta;
  const currencies = currenciesQuery.data ?? [];
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Supplier>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        className: "font-mono text-sm",
        cell: (supplier) => (
          <RecordLink href={`/suppliers/${supplier.id}`}>{supplier.code}</RecordLink>
        ),
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (supplier) => (
          <RecordLink href={`/suppliers/${supplier.id}`}>{supplier.name}</RecordLink>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: (supplier) => COMPANY_TYPE_LABELS[supplier.company_type],
      },
      {
        id: "tax_treatment",
        header: "Tax treatment",
        sortableField: "tax_treatment",
        cell: (supplier) => TAX_TREATMENT_LABELS[supplier.tax_treatment],
      },
      {
        id: "status",
        header: "Status",
        sortableField: "is_active",
        cell: (supplier) => <ActiveBadge active={supplier.is_active} />,
      },
      {
        id: "trn",
        header: "TRN",
        defaultVisible: false,
        className: "font-mono text-xs",
        cell: (supplier) => supplier.trn || "—",
      },
      {
        id: "currency",
        header: "Currency",
        defaultVisible: false,
        cell: (supplier) =>
          (currenciesQuery.data ?? []).find((currency) => currency.id === supplier.currency_id)
            ?.code ?? "—",
      },
      {
        id: "credit_limit",
        header: "Credit limit",
        defaultVisible: false,
        cell: (supplier) => {
          const currency = (currenciesQuery.data ?? []).find(
            (item) => item.id === supplier.currency_id,
          );
          return formatMoney(
            supplier.credit_limit,
            currency?.code ?? baseCurrencyCode ?? "",
            currency?.decimal_places,
          );
        },
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (supplier) => supplier.notes || "—",
      },
      {
        id: "payment_terms",
        header: "Payment terms",
        defaultVisible: false,
        cell: (supplier) =>
          supplier.payment_terms_id
            ? ((paymentTermsQuery.data ?? []).find((term) => term.id === supplier.payment_terms_id)
                ?.name ?? "—")
            : "—",
      },
      {
        id: "price_list",
        header: "Price list",
        defaultVisible: false,
        cell: (supplier) =>
          supplier.default_price_list_id
            ? ((priceListsQuery.data ?? []).find(
                (list) => list.id === supplier.default_price_list_id,
              )?.name ?? "—")
            : "—",
      },
      ...auditTimestampColumns<Supplier>(),
      ...auditActorColumns<Supplier>(userNameById),
      ...actionsColumn<Supplier>(showActions, (supplier) => (
        <DataTableRowActions
          entityName={supplier.name}
          viewHref={canRead ? `/suppliers/${supplier.id}` : undefined}
          editHref={canUpdate ? `/suppliers/${supplier.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(supplier) : undefined}
        />
      )),
    ];
  }, [
    baseCurrencyCode,
    canDelete,
    canRead,
    canUpdate,
    currenciesQuery.data,
    paymentTermsQuery.data,
    priceListsQuery.data,
    showActions,
    userNameById,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.suppliers", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteSupplier.mutateAsync(deleting.id);
      toast.success("Supplier deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Suppliers"
        subtitle="Purchase-side supplier master"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImexToolbar
              resource="suppliers"
              title="suppliers"
              canImport={can(supplierPermissions.import) || canCreate}
              canExport={can(supplierPermissions.export) || canRead}
              exportParams={{ search }}
              onImported={() => {
                void suppliersQuery.refetch();
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
                New Supplier
              </Button>
            ) : null}
          </div>
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name, code, TRN, notes…"
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
          label="Tax treatment"
          className="w-44"
          placeholder="Tax treatment"
          value={filters.tax_treatment ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { tax_treatment: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All treatments" },
            ...TAX_TREATMENTS.map((treatment) => ({
              value: treatment,
              label: TAX_TREATMENT_LABELS[treatment],
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
          <FilterField label="Currency" htmlFor="supplier-filter-currency">
            <FilterSelect
              id="supplier-filter-currency"
              className="w-full"
              placeholder="Currency"
              value={draftCurrency}
              onValueChange={setDraftCurrency}
              options={[
                { value: ALL, label: "All currencies" },
                ...currencies.map((currency) => ({ value: currency.id, label: currency.code })),
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
        {search || filters.is_active || filters.tax_treatment || extraCount > 0 || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null, tax_treatment: null, currency_id: null },
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
          {suppliersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : suppliersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(suppliersQuery.error)}
                  onRetry={() => suppliersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No suppliers"
                  message={emptyListMessage(canCreate, "Create a supplier to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((supplier) => (
              <TableRow key={supplier.id}>
                <DataTableCells columns={columns} row={supplier} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <SupplierFormDialog open={formOpen} supplier={null} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete supplier"
        description={deleteDescription(deleting)}
        confirmLabel="Delete"
        pending={deleteSupplier.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
