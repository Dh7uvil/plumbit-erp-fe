"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { salesmenApi } from "@/modules/erp/salesmen/api";
import type { SalesmanOverviewRow } from "@/modules/erp/salesmen/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { ListPage } from "@/shared/components/layout/list-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatReportMoney } from "@/shared/lib/format";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function SalesmenScreen() {
  const { baseCurrencyCode } = useBaseCurrency();
  const fiscalYear = new Date().getFullYear();
  const query = useQuery({
    queryKey: useTenantQueryKey(["salesmen", fiscalYear]),
    queryFn: () => salesmenApi.list(fiscalYear),
  });
  const rows = query.data ?? [];
  const periodHeaders = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")),
    [],
  );

  return (
    <ListPage title="Salesmen" subtitle={`Target vs actual — FY ${fiscalYear}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance by period</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? <Skeleton className="h-48 w-full" /> : null}
          {query.isError ? (
            <DataTableError
              message={getErrorMessage(query.error)}
              onRetry={() => query.refetch()}
            />
          ) : null}
          {!query.isLoading && !query.isError && rows.length === 0 ? (
            <DataTableEmpty title="No salespeople" message="Add active employees to see targets." />
          ) : null}
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-medium">Code</th>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    {periodHeaders.map((label) => (
                      <th key={label} className="py-2 px-1 text-right font-medium tabular-nums">
                        {label}
                      </th>
                    ))}
                    <th className="py-2 pl-2 text-right font-medium">Target</th>
                    <th className="py-2 pl-2 text-right font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <SalesmanRow
                      key={row.employee_id}
                      row={row}
                      currencyCode={baseCurrencyCode ?? ""}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </ListPage>
  );
}

function SalesmanRow({
  row,
  currencyCode,
}: {
  row: SalesmanOverviewRow;
  currencyCode: string;
}) {
  const byPeriod = useMemo(
    () => new Map(row.periods.map((item) => [item.period, item])),
    [row.periods],
  );
  return (
    <tr className="border-b">
      <td className="py-2 pr-3 tabular-nums">{row.employee_code}</td>
      <td className="py-2 pr-3">{row.name}</td>
      {Array.from({ length: 12 }, (_, index) => index + 1).map((period) => {
        const item = byPeriod.get(period);
        return (
          <td key={period} className="py-2 px-1 text-right tabular-nums text-xs">
            {item
              ? formatReportMoney(item.actual, currencyCode)
              : formatReportMoney("0", currencyCode)}
          </td>
        );
      })}
      <td className="py-2 pl-2 text-right tabular-nums">
        {formatReportMoney(row.target_total, currencyCode)}
      </td>
      <td className="py-2 pl-2 text-right tabular-nums">
        {formatReportMoney(row.actual_total, currencyCode)}
      </td>
    </tr>
  );
}
