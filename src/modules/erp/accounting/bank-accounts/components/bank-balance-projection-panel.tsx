"use client";

import { useState } from "react";

import { useBankBalanceProjection } from "@/modules/erp/accounting/bank-accounts/queries";
import type { BankAccount } from "@/modules/erp/accounting/bank-accounts/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, formatMoney, humanizeEnum } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function BankBalanceProjectionPanel({ bankAccount }: { bankAccount: BankAccount }) {
  const [asOf, setAsOf] = useState(todayIsoDate());
  const [horizonDays, setHorizonDays] = useState("30");
  const horizon = Number.parseInt(horizonDays, 10);
  const projectionQuery = useBankBalanceProjection(
    bankAccount.id,
    { as_of: asOf, horizon_days: Number.isFinite(horizon) ? horizon : 30 },
    true,
  );
  const projection = projectionQuery.data;
  const currencyCode = projection?.currency_code ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="projection-as-of">As of</Label>
          <Input
            id="projection-as-of"
            type="date"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projection-horizon">Horizon (days)</Label>
          <Input
            id="projection-horizon"
            type="number"
            min={1}
            max={365}
            value={horizonDays}
            onChange={(event) => setHorizonDays(event.target.value)}
          />
        </div>
      </div>
      {projectionQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : projectionQuery.isError ? (
        <DataTableError
          message={getErrorMessage(projectionQuery.error)}
          onRetry={() => projectionQuery.refetch()}
        />
      ) : projection ? (
        <>
          <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm">Book balance</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatMoney(projection.book_balance, currencyCode)}
              </div>
              <div className="text-muted-foreground text-xs">As of {formatDate(projection.as_of)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Projected balance</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatMoney(projection.projected_balance, currencyCode)}
              </div>
              <div className="text-muted-foreground text-xs">
                Through {formatDate(projection.horizon_date)}
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.lines.map((line, index) => (
                <TableRow key={`${line.kind}-${line.event_date}-${index}`}>
                  <TableCell>{formatDate(line.event_date)}</TableCell>
                  <TableCell>{humanizeEnum(line.kind)}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(line.amount, currencyCode)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : null}
    </div>
  );
}
