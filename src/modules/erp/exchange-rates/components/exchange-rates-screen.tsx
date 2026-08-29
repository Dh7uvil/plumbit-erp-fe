"use client";

import { Edit2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { ExchangeRateFormDialog } from "@/modules/erp/exchange-rates/components/exchange-rate-form-dialog";
import { exchangeRatePermissions } from "@/modules/erp/exchange-rates/permissions";
import { useExchangeRates } from "@/modules/erp/exchange-rates/queries";
import type { ExchangeRate } from "@/modules/erp/exchange-rates/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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

const HEADERS = ["From currency", "Rate to base", "Effective date", "Actions"] as const;

export function ExchangeRatesScreen() {
  const can = useCan();
  const { filters, setParams } = useTableParams();
  const effectiveDate = filters.effective_date;
  const exchangeRatesQuery = useExchangeRates({
    effective_date: effectiveDate,
  });
  const currenciesQuery = useAllCurrencies();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExchangeRate | null>(null);

  const rows = exchangeRatesQuery.data?.data ?? [];
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Exchange rates"
        subtitle="Org-level daily user-entered rates versus the base currency"
        actions={
          can(exchangeRatePermissions.create) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
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
      </DataTableToolbar>
      <DataTable>
        <TableHeader>
          <TableRow>
            {HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {exchangeRatesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : exchangeRatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(exchangeRatesQuery.error)}
                  onRetry={() => exchangeRatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty
                  title="No exchange rates"
                  message="Save an exchange rate to get started."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="font-medium">
                  {currencyLabel(rate.from_currency_id)}
                </TableCell>
                <TableCell>{rate.rate}</TableCell>
                <TableCell>{rate.effective_date}</TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(exchangeRatePermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit rate for ${currencyLabel(rate.from_currency_id)}`}
                        onClick={() => {
                          setEditing(rate);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <ExchangeRateFormDialog
        open={formOpen}
        rate={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
      />
    </div>
  );
}
