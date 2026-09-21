"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatMoney } from "@/shared/lib/format";

export function DocumentSettlementCard({
  amountPaid,
  amountAdjusted,
  adjustedLabel,
  amountWrittenOff,
  balanceDue,
  currencyCode,
}: {
  amountPaid: string;
  amountAdjusted: string;
  adjustedLabel: string;
  amountWrittenOff?: string;
  balanceDue: string;
  currencyCode: string;
}) {
  const writtenOff = amountWrittenOff ?? "0";
  const showWrittenOff = Number.parseFloat(writtenOff) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Settlement</CardTitle>
      </CardHeader>
      <CardContent>
        <dl
          className={`grid gap-3 text-sm ${showWrittenOff ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}
        >
          <div>
            <dt className="text-muted-foreground">Amount paid</dt>
            <dd className="tabular-nums">{formatMoney(amountPaid, currencyCode)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{adjustedLabel}</dt>
            <dd className="tabular-nums">{formatMoney(amountAdjusted, currencyCode)}</dd>
          </div>
          {showWrittenOff ? (
            <div>
              <dt className="text-muted-foreground">Written off</dt>
              <dd className="tabular-nums">{formatMoney(writtenOff, currencyCode)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Balance due</dt>
            <dd className="font-medium tabular-nums">{formatMoney(balanceDue, currencyCode)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
