"use client";

import type { DocumentTotals } from "@/shared/components/document/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDecimal, formatMoney } from "@/shared/lib/format";

export function DocumentTotalsPanel({
  totals,
  currencies,
}: {
  totals: DocumentTotals;
  currencies: readonly { id: string; code: string }[];
}) {
  const currency = currencies.find((item) => item.id === totals.currency_id);
  const baseCurrency = currencies.find((item) => item.id === totals.base_currency_id);
  const code = currency?.code ?? "";
  const baseCode = baseCurrency?.code ?? "";

  const rows = [
    { label: "Subtotal", value: formatMoney(totals.subtotal, code) },
    { label: "Discount", value: formatMoney(totals.discount_amount, code) },
    { label: "Tax", value: formatMoney(totals.tax_amount, code) },
    { label: "Grand total", value: formatMoney(totals.grand_total, code) },
    { label: "Foreign amount", value: formatMoney(totals.foreign_amount, code) },
    { label: "Base amount", value: formatMoney(totals.base_amount, baseCode) },
    {
      label: `Exchange rate${code && baseCode ? ` (${code}/${baseCode})` : ""}`,
      value: totals.exchange_rate ? formatDecimal(totals.exchange_rate) : "—",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Totals</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground text-sm">{row.label}</dt>
              <dd className="text-right font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
