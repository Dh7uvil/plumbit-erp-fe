"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { ExchangeRateFormDialog } from "@/modules/erp/exchange-rates/components/exchange-rate-form-dialog";
import { exchangeRatePermissions } from "@/modules/erp/exchange-rates/permissions";
import { useExchangeRates } from "@/modules/erp/exchange-rates/queries";
import type { ExchangeRate } from "@/modules/erp/exchange-rates/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["From currency", "Rate to base", "Effective date"] as const;
const SORT_FIELDS = [
  { value: "effective_date", label: "Effective date" },
  { value: "rate", label: "Rate to base" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  "Rate to base": "rate",
  "Effective date": "effective_date",
};

export function ExchangeRatesScreen() {
  const { canCreate, canRead, canUpdate } = useCrudPermissions(exchangeRatePermissions);
  const { page, page_size, sort_by, sort_order, filters, setParams, setPage } = useTableParams();
  const effectiveDate = filters.effective_date;
  const exchangeRatesQuery = useExchangeRates({
    page,
    page_size,
    effective_date: effectiveDate,
    sort_by,
    sort_order,
  });
  const currenciesQuery = useAllCurrencies();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ExchangeRate | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const showActions = hasRowActions(canRead, canUpdate);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = exchangeRatesQuery.data?.data ?? [];
  const meta = exchangeRatesQuery.data?.meta;
  const currenciesById = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>();
    for (const currency of currenciesQuery.data ?? []) {
      map.set(currency.id, { name: currency.name, code: currency.code });
    }
    return map;
  }, [currenciesQuery.data]);

  function currencyLabel(id: string): string {
    const currency = currenciesById.get(id);
    return currency ? `${currency.code} · ${currency.name}` : id;
  }

  function openCreate() {
    setSelected(null);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  function openView(rate: ExchangeRate) {
    setSelected(rate);
    setForceReadOnly(true);
    setFormOpen(true);
  }

  function openEdit(rate: ExchangeRate) {
    setSelected(rate);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  return (
    <ListPage>
      <PageHeader
        title="Exchange rates"
        subtitle="Org-level daily user-entered rates versus the base currency"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Exchange Rate
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <Input
          type="date"
          value={effectiveDate ?? ""}
          onChange={(event) =>
            setParams({ filters: { effective_date: event.target.value || null } })
          }
          aria-label="Effective date"
          className="w-44"
        />
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {effectiveDate || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                sort_by: null,
                sort_order: null,
                filters: { effective_date: null },
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
          {exchangeRatesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : exchangeRatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(exchangeRatesQuery.error)}
                  onRetry={() => exchangeRatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No exchange rates"
                  message={emptyListMessage(canCreate, "Save an exchange rate to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="font-medium">
                  {canRead ? (
                    <button
                      type="button"
                      className="cursor-pointer hover:underline"
                      onClick={() => openView(rate)}
                    >
                      {currencyLabel(rate.from_currency_id)}
                    </button>
                  ) : (
                    currencyLabel(rate.from_currency_id)
                  )}
                </TableCell>
                <TableCell>
                  {canRead ? (
                    <button
                      type="button"
                      className="cursor-pointer hover:underline"
                      onClick={() => openView(rate)}
                    >
                      {rate.rate}
                    </button>
                  ) : (
                    rate.rate
                  )}
                </TableCell>
                <TableCell>{rate.effective_date}</TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={currencyLabel(rate.from_currency_id)}
                      onView={canRead ? () => openView(rate) : undefined}
                      onEdit={canUpdate ? () => openEdit(rate) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <ExchangeRateFormDialog
        open={formOpen}
        rate={selected}
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelected(null);
            setForceReadOnly(false);
          }
        }}
      />
    </ListPage>
  );
}
