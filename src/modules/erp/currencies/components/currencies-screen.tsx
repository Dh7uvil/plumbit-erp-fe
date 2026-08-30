"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { useDeleteCurrency } from "@/modules/erp/currencies/mutations";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useCurrencies } from "@/modules/erp/currencies/queries";
import type { Currency } from "@/modules/erp/currencies/schemas";
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
import { Badge } from "@/shared/components/ui/badge";
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

const COLUMN_HEADERS = ["Code", "Name", "Symbol", "Decimals", "Base", "Status"] as const;
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

export function CurrenciesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(currencyPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const currenciesQuery = useCurrencies({
    page,
    page_size,
    search,
    is_base: parseBoolFilter(filters.is_base),
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteCurrency = useDeleteCurrency();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Currency | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = currenciesQuery.data?.data ?? [];
  const meta = currenciesQuery.data?.meta;

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteCurrency.mutateAsync(deleting.id);
      toast.success("Currency deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Currencies"
        subtitle="Tenant currency master including the base currency"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Currency
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search currencies…"
        />
        <FilterSelect
          className="w-36"
          placeholder="Base"
          value={filters.is_base ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_base: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All" },
            { value: "true", label: "Base" },
            { value: "false", label: "Non-base" },
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
          {currenciesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : currenciesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(currenciesQuery.error)}
                  onRetry={() => currenciesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No currencies"
                  message={emptyListMessage(canCreate, "Create a currency to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((currency) => (
              <TableRow key={currency.id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/currencies/${currency.id}`}>{currency.code}</RecordLink>
                </TableCell>
                <TableCell className="font-medium">
                  <RecordLink href={`/currencies/${currency.id}`}>{currency.name}</RecordLink>
                </TableCell>
                <TableCell>{currency.symbol}</TableCell>
                <TableCell>{currency.decimal_places}</TableCell>
                <TableCell>{currency.is_base ? <Badge variant="info">Base</Badge> : "—"}</TableCell>
                <TableCell>
                  <ActiveBadge active={currency.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={currency.name}
                      viewHref={canRead ? `/currencies/${currency.id}` : undefined}
                      editHref={canUpdate ? `/currencies/${currency.id}/edit` : undefined}
                      onDelete={
                        canDelete && !currency.is_base ? () => setDeleting(currency) : undefined
                      }
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <CurrencyFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete currency"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this currency"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteCurrency.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
