"use client";

import type { PartyCurrencyMode, PartyPdcBalance, PartyPeriodBalances } from "@/modules/crm/customers/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatReportMoney } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

export function PartyPdcBalanceCard({
  data,
  isLoading,
  error,
}: {
  data: PartyPdcBalance | undefined;
  isLoading: boolean;
  error: unknown;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">PDC balance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-6 w-56" /> : null}
        {error ? <p className="text-destructive text-sm">{getErrorMessage(error)}</p> : null}
        {data ? (
          <p className="text-sm tabular-nums">
            {data.cheque_count} pending cheque{data.cheque_count === 1 ? "" : "s"}:{" "}
            {formatReportMoney(data.amount, data.currency_code)} (
            {formatReportMoney(data.base_amount, data.base_currency_code)} home)
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PartyPeriodBalancesCard({
  data,
  isLoading,
  error,
  currencyMode,
  onCurrencyModeChange,
  homeCurrencyCode,
  partyCurrencyCode,
}: {
  data: PartyPeriodBalances | undefined;
  isLoading: boolean;
  error: unknown;
  currencyMode: PartyCurrencyMode;
  onCurrencyModeChange: (mode: PartyCurrencyMode) => void;
  homeCurrencyCode: string;
  partyCurrencyCode: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">
          Period balances{data ? ` — FY ${data.fiscal_year}` : ""}
        </CardTitle>
        <div className="flex flex-wrap gap-1">
          {(
            [
              { value: "home" as const, label: `Home (${homeCurrencyCode || "—"})` },
              { value: "party" as const, label: `Party (${partyCurrencyCode || "—"})` },
            ] as const
          ).map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={currencyMode === option.value ? "secondary" : "outline"}
              className={cn("h-8")}
              onClick={() => onCurrencyModeChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : null}
        {error ? <p className="text-destructive text-sm">{getErrorMessage(error)}</p> : null}
        {data ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-medium">Period</th>
                  <th className="py-2 pr-3 font-medium text-right">Debit</th>
                  <th className="py-2 pr-3 font-medium text-right">Credit</th>
                  <th className="py-2 font-medium text-right">Cur. balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium">OP. Balance</td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 pr-3" />
                  <td className="py-2 text-right tabular-nums">
                    {formatReportMoney(data.opening, data.currency_code)}
                  </td>
                </tr>
                {data.periods.map((row) => (
                  <tr key={row.period} className="border-b">
                    <td className="py-2 pr-3 tabular-nums">
                      {String(row.period).padStart(2, "0")}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatReportMoney(row.debit, data.currency_code)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatReportMoney(row.credit, data.currency_code)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatReportMoney(row.closing, data.currency_code)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3 font-medium">Closing</td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 pr-3" />
                  <td className="py-2 text-right tabular-nums font-medium">
                    {formatReportMoney(data.closing, data.currency_code)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
