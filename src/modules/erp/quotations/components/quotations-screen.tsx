"use client";

import { Copy, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { QuotationStatusBadge } from "@/modules/erp/quotations/components/quotation-status-badge";
import { useCloneQuotation } from "@/modules/erp/quotations/mutations";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { useQuotations } from "@/modules/erp/quotations/queries";
import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUSES,
  quotationDisplayNumber,
  type QuotationStatus,
} from "@/modules/erp/quotations/schemas";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
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
import { formatDate, formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const HEADERS = ["Number", "Customer", "Date", "Status", "Grand total", "Actions"] as const;
const ALL = "all";
const SORT_FIELDS = [
  { value: "quote_number", label: "Number" },
  { value: "quote_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "grand_total", label: "Grand total" },
] as const;

function parseStatus(value: string | undefined): QuotationStatus | undefined {
  return QUOTATION_STATUSES.includes(value as QuotationStatus)
    ? (value as QuotationStatus)
    : undefined;
}

export function QuotationsScreen() {
  const can = useCan();
  const router = useRouter();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const quotationsQuery = useQuotations({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    customer_id: filters.customer_id,
    branch_id: filters.branch_id,
    currency_id: filters.currency_id,
  });
  const customersQuery = useAllCustomers();
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const cloneQuotation = useCloneQuotation();

  const rows = quotationsQuery.data?.data ?? [];
  const meta = quotationsQuery.data?.meta;
  const customers = customersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));
  const currencyCodeById = new Map(currencies.map((currency) => [currency.id, currency.code]));

  async function onClone(id: string) {
    try {
      const cloned = await cloneQuotation.mutateAsync(id);
      toast.success("Quotation cloned");
      router.push(`/quotations/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Quotations"
        subtitle="Customer quotes with server-side totals"
        actions={
          can(quotationPermissions.create) ? (
            <Button type="button" size="sm" asChild>
              <Link href="/quotations/new">
                <Plus className="size-3.5" />
                New quotation
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search quotations…"
        />
        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {QUOTATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {QUOTATION_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.customer_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { customer_id: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All customers</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.branch_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { branch_id: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
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
          value={sort_by ?? ALL}
          onValueChange={(value) =>
            setParams({
              sort_by: value === ALL ? null : value,
              sort_order: value === ALL ? null : (sort_order ?? "desc"),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Default sort</SelectItem>
            {SORT_FIELDS.map((field) => (
              <SelectItem key={field.value} value={field.value}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort_order ?? "desc"}
          onValueChange={(value) =>
            setParams({ sort_order: value === "asc" || value === "desc" ? value : null })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {HEADERS.map((header) => (
              <TableHead
                key={header}
                className={header === "Grand total" ? "text-right" : undefined}
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotationsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : quotationsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(quotationsQuery.error)}
                  onRetry={() => quotationsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty
                  title="No quotations"
                  message="Create a quotation to get started."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((quotation) => {
              const number = quotationDisplayNumber(quotation);
              const currencyCode = currencyCodeById.get(quotation.currency_id) ?? "";
              return (
                <TableRow key={quotation.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/quotations/${quotation.id}`} className="hover:underline">
                      {number ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {customerNameById.get(quotation.customer_id) ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(quotation.quote_date)}</TableCell>
                  <TableCell>
                    <QuotationStatusBadge status={quotation.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(quotation.grand_total, currencyCode)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {can(quotationPermissions.create) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Clone quotation"
                          disabled={cloneQuotation.isPending}
                          onClick={() => void onClone(quotation.id)}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
    </div>
  );
}
