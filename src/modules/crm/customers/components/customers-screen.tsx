"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { useDeleteCustomer } from "@/modules/crm/customers/mutations";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useCustomers } from "@/modules/crm/customers/queries";
import {
  COMPANY_TYPE_LABELS,
  COMPANY_TYPES,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  type CompanyType,
  type Customer,
  type TaxTreatment,
} from "@/modules/crm/customers/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
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
import { useCan } from "@/shared/providers/session-provider";

const HEADERS = ["Code", "Name", "Type", "Tax treatment", "Status", "Actions"] as const;
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

function parseCompanyType(value: string | undefined): CompanyType | undefined {
  return COMPANY_TYPES.includes(value as CompanyType) ? (value as CompanyType) : undefined;
}

function parseTaxTreatment(value: string | undefined): TaxTreatment | undefined {
  return TAX_TREATMENTS.includes(value as TaxTreatment) ? (value as TaxTreatment) : undefined;
}

export function CustomersScreen() {
  const can = useCan();
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const customersQuery = useCustomers({
    page,
    page_size,
    search,
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
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Customers"
        subtitle="Quote-ready customer master"
        actions={
          can(customerPermissions.create) ? (
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
        <Select
          value={filters.company_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { company_type: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {COMPANY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {COMPANY_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.tax_treatment ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { tax_treatment: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tax treatment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All treatments</SelectItem>
            {TAX_TREATMENTS.map((treatment) => (
              <SelectItem key={treatment} value={treatment}>
                {TAX_TREATMENT_LABELS[treatment]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.currency_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { currency_id: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All currencies</SelectItem>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.code}
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
          {customersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : customersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(customersQuery.error)}
                  onRetry={() => customersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty title="No customers" message="Create a customer to get started." />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-mono text-sm">
                  <Link href={`/customers/${customer.id}`} className="hover:underline">
                    {customer.code}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{COMPANY_TYPE_LABELS[customer.company_type]}</TableCell>
                <TableCell>{TAX_TREATMENT_LABELS[customer.tax_treatment]}</TableCell>
                <TableCell>
                  <ActiveBadge active={customer.is_active} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(customerPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${customer.name}`}
                        asChild
                      >
                        <Link href={`/customers/${customer.id}`}>
                          <Edit2 className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    {can(customerPermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${customer.name}`}
                        onClick={() => setDeleting(customer)}
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
      <CustomerFormDialog open={formOpen} customer={null} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete customer"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this customer"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteCustomer.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
