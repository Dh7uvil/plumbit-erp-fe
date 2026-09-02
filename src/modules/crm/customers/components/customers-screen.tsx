"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
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
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
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
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["Code", "Name", "Type", "Tax treatment", "Status"] as const;
const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
  { value: "company_type", label: "Type" },
  { value: "tax_treatment", label: "Tax treatment" },
  { value: "is_active", label: "Status" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Code: "code",
  Name: "name",
  Type: "company_type",
  "Tax treatment": "tax_treatment",
  Status: "is_active",
};
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
  const deleteCustomer = useDeleteCustomer();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const rows = customersQuery.data?.data ?? [];
  const meta = customersQuery.data?.meta;
  const currencies = currenciesQuery.data ?? [];
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

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
        subtitle="Quote-ready customer master"
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
              New Customer
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search customers…"
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
          {customersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : customersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(customersQuery.error)}
                  onRetry={() => customersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No customers"
                  message={emptyListMessage(canCreate, "Create a customer to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/customers/${customer.id}`}>{customer.code}</RecordLink>
                </TableCell>
                <TableCell className="font-medium">
                  <RecordLink href={`/customers/${customer.id}`}>{customer.name}</RecordLink>
                </TableCell>
                <TableCell>{COMPANY_TYPE_LABELS[customer.company_type]}</TableCell>
                <TableCell>{TAX_TREATMENT_LABELS[customer.tax_treatment]}</TableCell>
                <TableCell>
                  <ActiveBadge active={customer.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={customer.name}
                      viewHref={canRead ? `/customers/${customer.id}` : undefined}
                      editHref={canUpdate ? `/customers/${customer.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(customer) : undefined}
                    />
                  </TableCell>
                ) : null}
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
