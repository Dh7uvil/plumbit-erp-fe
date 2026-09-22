"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { useDeleteCustomer } from "@/modules/crm/customers/mutations";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useCustomers } from "@/modules/crm/customers/queries";
import {
  COMPANY_TYPE_LABELS,
  CUSTOMER_COMPANY_TYPE_LABELS,
  CUSTOMER_COMPANY_TYPES,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  type Customer,
  type CustomerCompanyType,
  type TaxTreatment,
} from "@/modules/crm/customers/schemas";
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
import { formatMoney } from "@/shared/lib/format";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
  { value: "company_type", label: "Type" },
  { value: "tax_treatment", label: "Tax treatment" },
  { value: "is_active", label: "Status" },
] as const;
const ALL = "all";
const EMPTY_EXTRA = { taxTreatment: ALL, currencyId: ALL };

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

function parseCompanyType(value: string | undefined): CustomerCompanyType | undefined {
  return CUSTOMER_COMPANY_TYPES.includes(value as CustomerCompanyType)
    ? (value as CustomerCompanyType)
    : undefined;
}

function parseTaxTreatment(value: string | undefined): TaxTreatment | undefined {
  return TAX_TREATMENTS.includes(value as TaxTreatment) ? (value as TaxTreatment) : undefined;
}

export function CustomersScreen() {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(customerPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    taxTreatment: filters.tax_treatment ?? ALL,
    currencyId: filters.currency_id ?? ALL,
  };
  const extraCount = [extraFilters.taxTreatment !== ALL, extraFilters.currencyId !== ALL].filter(
    Boolean,
  ).length;
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const customersQuery = useCustomers({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    tax_treatment: parseTaxTreatment(filters.tax_treatment),
    currency_id: filters.currency_id,
    company_type: parseCompanyType(filters.company_type),
    is_active: parseBoolFilter(filters.is_active),
  });
  const currenciesQuery = useAllCurrencies();
  const paymentTermsQuery = useAllPaymentTerms(can(paymentTermPermissions.read));
  const priceListsQuery = useAllPriceLists(can(priceListPermissions.read));
  const deleteCustomer = useDeleteCustomer();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const rows = customersQuery.data?.data ?? [];
  const meta = customersQuery.data?.meta;
  const currencies = currenciesQuery.data ?? [];
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Customer>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        className: "font-mono text-sm",
        cell: (customer) => (
          <RecordLink href={`/customers/${customer.id}`}>{customer.code}</RecordLink>
        ),
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (customer) => (
          <RecordLink href={`/customers/${customer.id}`}>{customer.name}</RecordLink>
        ),
      },
      {
        id: "type",
        header: "Type",
        sortableField: "company_type",
        cell: (customer) => COMPANY_TYPE_LABELS[customer.company_type],
      },
      {
        id: "tax_treatment",
        header: "Tax treatment",
        sortableField: "tax_treatment",
        cell: (customer) => TAX_TREATMENT_LABELS[customer.tax_treatment],
      },
      {
        id: "status",
        header: "Status",
        sortableField: "is_active",
        cell: (customer) => <ActiveBadge active={customer.is_active} />,
      },
      {
        id: "trn",
        header: "TRN",
        defaultVisible: false,
        className: "font-mono text-xs",
        cell: (customer) => customer.trn || "—",
      },
      {
        id: "currency",
        header: "Currency",
        defaultVisible: false,
        cell: (customer) =>
          (currenciesQuery.data ?? []).find((currency) => currency.id === customer.currency_id)
            ?.code ?? "—",
      },
      {
        id: "credit_limit",
        header: "Credit limit",
        defaultVisible: false,
        cell: (customer) => {
          const currency = (currenciesQuery.data ?? []).find(
            (item) => item.id === customer.currency_id,
          );
          return currency
            ? formatMoney(customer.credit_limit, currency.code, currency.decimal_places)
            : formatMoney(customer.credit_limit, "AED");
        },
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (customer) => customer.notes || "—",
      },
      {
        id: "payment_terms",
        header: "Payment terms",
        defaultVisible: false,
        cell: (customer) =>
          customer.payment_terms_id
            ? ((paymentTermsQuery.data ?? []).find((term) => term.id === customer.payment_terms_id)
                ?.name ?? "—")
            : "—",
      },
      {
        id: "price_list",
        header: "Price list",
        defaultVisible: false,
        cell: (customer) =>
          customer.default_price_list_id
            ? ((priceListsQuery.data ?? []).find(
                (list) => list.id === customer.default_price_list_id,
              )?.name ?? "—")
            : "—",
      },
      ...auditTimestampColumns<Customer>(),
      ...auditActorColumns<Customer>(userNameById),
      ...actionsColumn<Customer>(showActions, (customer) => (
        <DataTableRowActions
          entityName={customer.name}
          viewHref={canRead ? `/customers/${customer.id}` : undefined}
          editHref={canUpdate ? `/customers/${customer.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(customer) : undefined}
        />
      )),
    ];
  }, [
    canDelete,
    canRead,
    canUpdate,
    currenciesQuery.data,
    paymentTermsQuery.data,
    priceListsQuery.data,
    showActions,
    userNameById,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("crm.customers", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteCustomer.mutateAsync(deleting.id);
      toast.success("Customer deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Customers"
        subtitle="Customers you sell to"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImexToolbar
              resource="customers"
              title="customers"
              canImport={can(customerPermissions.import) || canCreate}
              canExport={can(customerPermissions.export) || canRead}
              exportParams={{
                search,
                tax_treatment: filters.tax_treatment,
                currency_id: filters.currency_id,
                company_type: filters.company_type,
                is_active: filters.is_active,
              }}
              onImported={() => {
                void customersQuery.refetch();
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
                New Customer
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
          label="Type"
          className="w-48"
          placeholder="Type"
          value={filters.company_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { company_type: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All types" },
            ...CUSTOMER_COMPANY_TYPES.map((type) => ({
              value: type,
              label: CUSTOMER_COMPANY_TYPE_LABELS[type],
            })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={
            [draftExtra.taxTreatment !== ALL, draftExtra.currencyId !== ALL].filter(Boolean).length
          }
          description="Filter by tax treatment and currency."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                tax_treatment: draftExtra.taxTreatment === ALL ? null : draftExtra.taxTreatment,
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
              },
            })
          }
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <FilterField label="Tax treatment" htmlFor="customer-filter-tax">
            <FilterSelect
              id="customer-filter-tax"
              className="w-full"
              placeholder="Tax treatment"
              value={draftExtra.taxTreatment}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, taxTreatment: value }))
              }
              options={[
                { value: ALL, label: "All treatments" },
                ...TAX_TREATMENTS.map((treatment) => ({
                  value: treatment,
                  label: TAX_TREATMENT_LABELS[treatment],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Currency" htmlFor="customer-filter-currency">
            <FilterSelect
              id="customer-filter-currency"
              className="w-full"
              placeholder="Currency"
              value={draftExtra.currencyId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, currencyId: value }))
              }
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
        {search || filters.is_active || filters.company_type || extraCount > 0 || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: {
                  is_active: null,
                  company_type: null,
                  tax_treatment: null,
                  currency_id: null,
                },
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
          {customersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : customersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(customersQuery.error)}
                  onRetry={() => customersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No customers"
                  message={emptyListMessage(canCreate, "Create a customer to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((customer) => (
              <TableRow key={customer.id}>
                <DataTableCells columns={columns} row={customer} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <CustomerFormDialog open={formOpen} customer={null} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete customer"
        description={
          deleting?.company_type === "BOTH"
            ? `Delete "${deleting.name}"? This party will disappear from both Customers and Suppliers. This cannot be undone.`
            : `Delete ${deleting ? `"${deleting.name}"` : "this customer"}? This cannot be undone.`
        }
        confirmLabel="Delete"
        pending={deleteCustomer.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
