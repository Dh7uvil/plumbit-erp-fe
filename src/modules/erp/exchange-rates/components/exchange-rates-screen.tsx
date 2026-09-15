"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { ExchangeRateFormDialog } from "@/modules/erp/exchange-rates/components/exchange-rate-form-dialog";
import { useDeleteExchangeRate } from "@/modules/erp/exchange-rates/mutations";
import { exchangeRatePermissions } from "@/modules/erp/exchange-rates/permissions";
import { useExchangeRates } from "@/modules/erp/exchange-rates/queries";
import type { ExchangeRate } from "@/modules/erp/exchange-rates/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
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
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar, ToolbarControl } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const SORT_FIELDS = [
  { value: "effective_date", label: "Effective date" },
  { value: "rate", label: "Rate to base" },
] as const;

export function ExchangeRatesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(exchangeRatePermissions);
  const canEditRate = canCreate || canUpdate;
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const effectiveDate = filters.effective_date;
  const exchangeRatesQuery = useExchangeRates({
    page,
    page_size,
    search,
    effective_date: effectiveDate,
    sort_by,
    sort_order,
  });
  const currenciesQuery = useAllCurrencies();
  const deleteRate = useDeleteExchangeRate();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ExchangeRate | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [deleting, setDeleting] = useState<ExchangeRate | null>(null);
  const showActions = hasRowActions(canRead, canEditRate, canDelete);

  const rows = exchangeRatesQuery.data?.data ?? [];
  const meta = exchangeRatesQuery.data?.meta;
  const currenciesById = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>();
    for (const currency of currenciesQuery.data ?? []) {
      map.set(currency.id, { name: currency.name, code: currency.code });
    }
    return map;
  }, [currenciesQuery.data]);
  const userNameById = useUserNameMap();

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

  const columnDefs = useMemo((): Array<DataTableColumn<ExchangeRate>> => {
    function labelFor(id: string): string {
      const currency = currenciesById.get(id);
      return currency ? `${currency.code} · ${currency.name}` : id;
    }
    return [
      {
        id: "from_currency",
        header: "From currency",
        className: "font-medium",
        cell: (rate) =>
          canRead ? (
            <button
              type="button"
              className="cursor-pointer hover:underline"
              onClick={() => openView(rate)}
            >
              {labelFor(rate.from_currency_id)}
            </button>
          ) : (
            labelFor(rate.from_currency_id)
          ),
      },
      {
        id: "to_currency",
        header: "To currency",
        cell: (rate) => currenciesById.get(rate.to_currency_id)?.code ?? "—",
      },
      {
        id: "rate",
        header: "Rate to base",
        sortableField: "rate",
        cell: (rate) =>
          canRead ? (
            <button
              type="button"
              className="cursor-pointer hover:underline"
              onClick={() => openView(rate)}
            >
              {formatDecimal(rate.rate)}
            </button>
          ) : (
            formatDecimal(rate.rate)
          ),
      },
      {
        id: "effective_date",
        header: "Effective date",
        sortableField: "effective_date",
        cell: (rate) => formatDate(rate.effective_date),
      },
      ...auditTimestampColumns<ExchangeRate>(),
      ...auditActorColumns<ExchangeRate>(userNameById),
      ...actionsColumn<ExchangeRate>(showActions, (rate) => (
        <DataTableRowActions
          entityName={labelFor(rate.from_currency_id)}
          onView={canRead ? () => openView(rate) : undefined}
          onEdit={canEditRate ? () => openEdit(rate) : undefined}
          onDelete={canDelete ? () => setDeleting(rate) : undefined}
        />
      )),
    ];
  }, [canDelete, canEditRate, canRead, currenciesById, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.exchange_rates", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteRate.mutateAsync(deleting.id);
      toast.success("Exchange rate deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Exchange rates"
        subtitle="Daily rates versus the base currency. Documents can also store a rate when this list is empty."
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
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search currency code or name…"
        />
        <ToolbarControl label="Effective date" htmlFor="exchange-rate-effective-date">
          <Input
            id="exchange-rate-effective-date"
            type="date"
            value={effectiveDate ?? ""}
            onChange={(event) =>
              setParams({ filters: { effective_date: event.target.value || null } })
            }
            aria-label="Effective date"
            className="w-44"
          />
        </ToolbarControl>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {effectiveDate || sort_by || search ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
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
            <DataTableColumnHeads
              columns={columns}
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
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : exchangeRatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(exchangeRatesQuery.error)}
                  onRetry={() => exchangeRatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No exchange rates"
                  message={emptyListMessage(
                    canCreate,
                    "Save an exchange rate, or enter a rate on each foreign-currency document.",
                  )}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((rate) => (
              <TableRow key={rate.id}>
                <DataTableCells columns={columns} row={rate} />
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
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete exchange rate"
        description={`Delete the rate for ${
          deleting ? currencyLabel(deleting.from_currency_id) : "this currency"
        }? Documents already snapshot their rate.`}
        confirmLabel="Delete"
        pending={deleteRate.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
