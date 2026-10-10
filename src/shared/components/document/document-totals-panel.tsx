"use client";

import type { ReactNode } from "react";

import type { DocumentTotals } from "@/shared/components/document/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatMoney, formatRate, formatRawDecimal } from "@/shared/lib/format";

export type DocumentTotalsLiveExtras = {
  taxable_amount?: string;
  shipping_amount?: string;
  pre_round_grand_total?: string;
  round_off_amount?: string;
  net_total?: string;
};

export function DocumentTotalsPanel({
  totals,
  currencies,
  liveExtras,
}: {
  totals: DocumentTotals;
  currencies: readonly { id: string; code: string }[];
  liveExtras?: DocumentTotalsLiveExtras;
}) {
  const currency = currencies.find((item) => item.id === totals.currency_id);
  const baseCurrency = currencies.find((item) => item.id === totals.base_currency_id);
  const code = currency?.code ?? "";
  const baseCode = baseCurrency?.code ?? "";

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Subtotal", value: formatMoney(totals.subtotal, code) },
    { label: "Discount", value: formatMoney(totals.discount_amount, code) },
  ];
  if (liveExtras?.taxable_amount != null) {
    rows.push({
      label: "Taxable amount",
      value: formatMoney(liveExtras.taxable_amount, code),
    });
  }
  rows.push({ label: "Tax", value: formatMoney(totals.tax_amount, code) });
  if (liveExtras?.shipping_amount != null) {
    rows.push({
      label: "Freight",
      value: formatMoney(liveExtras.shipping_amount, code),
    });
  }
  if (liveExtras?.pre_round_grand_total != null) {
    rows.push({
      label: "G. total",
      value: formatMoney(liveExtras.pre_round_grand_total, code),
    });
  }
  if (liveExtras?.round_off_amount != null) {
    rows.push({
      label: "Round off",
      value: formatMoney(liveExtras.round_off_amount, code),
    });
  }
  rows.push({
    label: liveExtras?.net_total != null ? "Net total" : "Grand total",
    value: formatMoney(
      liveExtras?.net_total ?? totals.grand_total,
      code,
    ),
  });
  rows.push(
    { label: "Foreign amount", value: formatMoney(totals.foreign_amount, code) },
    { label: "Base amount", value: formatMoney(totals.base_amount, baseCode) },
    {
      label: `Exchange rate${code && baseCode ? ` (${code}/${baseCode})` : ""}`,
      value: totals.exchange_rate ? (
        <span title={formatRawDecimal(totals.exchange_rate)}>{formatRate(totals.exchange_rate)}</span>
      ) : (
        "—"
      ),
    },
  );

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
