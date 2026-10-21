"use client";

import type { ReactNode } from "react";

import type { DocumentTotals } from "@/shared/components/document/schemas";
import { computeBaseEquivalentAmount } from "@/shared/components/money/base-equivalent-preview";
import { MoneyWithBase } from "@/shared/components/money/money-with-base";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatMoney, formatRate, formatRawDecimal } from "@/shared/lib/format";

export type DocumentTotalsLiveExtras = {
  taxable_amount?: string;
  shipping_amount?: string;
  pre_round_grand_total?: string;
  round_off_amount?: string;
  net_total?: string;
};

export type DocumentTotalsPanelRateProps = {
  exchangeRate?: string | null;
  baseCurrencyCode?: string;
  sameCurrency?: boolean;
  rateStatusMessage?: string | null;
};

export function dualCurrencyBaseAmountForRow(
  label: string,
  foreignAmount: string,
  totalsBaseAmount: string,
  rate: string | null | undefined,
  sameCurrency: boolean,
): string | null {
  if (sameCurrency || !rate?.trim()) {
    return null;
  }
  if (label === "Net total" || label === "Grand total") {
    return totalsBaseAmount;
  }
  return computeBaseEquivalentAmount(foreignAmount, rate);
}

function totalsAmountCell(
  amount: string,
  currencyCode: string,
  label: string,
  totals: DocumentTotals,
  rateProps: DocumentTotalsPanelRateProps | undefined,
  baseCode: string,
): ReactNode {
  const rate = rateProps?.exchangeRate?.trim();
  const showDual = Boolean(rateProps && rate && rateProps.sameCurrency === false);
  if (!showDual) {
    return formatMoney(amount, currencyCode);
  }
  const baseAmount = dualCurrencyBaseAmountForRow(
    label,
    amount,
    totals.base_amount,
    rate,
    false,
  );
  return (
    <MoneyWithBase
      amount={amount}
      currencyCode={currencyCode}
      baseAmount={baseAmount}
      baseCurrencyCode={baseCode}
    />
  );
}

export function DocumentTotalsPanel({
  totals,
  currencies,
  liveExtras,
  rateProps,
  amountLabels,
}: {
  totals: DocumentTotals;
  currencies: readonly { id: string; code: string }[];
  liveExtras?: DocumentTotalsLiveExtras;
  rateProps?: DocumentTotalsPanelRateProps;
  /** Override foreign/base row labels (e.g. FCY / LCY for import bills). */
  amountLabels?: { foreign?: string; base?: string };
}) {
  const currency = currencies.find((item) => item.id === totals.currency_id);
  const baseCurrency = currencies.find((item) => item.id === totals.base_currency_id);
  const code = currency?.code ?? "";
  const baseCode = rateProps?.baseCurrencyCode ?? baseCurrency?.code ?? "";

  const amount = (value: string, label: string) =>
    totalsAmountCell(value, code, label, totals, rateProps, baseCode);

  const netLabel = liveExtras?.net_total != null ? "Net total" : "Grand total";
  const netAmount = liveExtras?.net_total ?? totals.grand_total;

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Subtotal", value: amount(totals.subtotal, "Subtotal") },
    { label: "Discount", value: amount(totals.discount_amount, "Discount") },
  ];
  if (liveExtras?.taxable_amount != null) {
    rows.push({
      label: "Taxable amount",
      value: amount(liveExtras.taxable_amount, "Taxable amount"),
    });
  }
  rows.push({ label: "Tax", value: amount(totals.tax_amount, "Tax") });
  if (liveExtras?.shipping_amount != null) {
    rows.push({
      label: "Freight",
      value: amount(liveExtras.shipping_amount, "Freight"),
    });
  }
  if (liveExtras?.pre_round_grand_total != null) {
    rows.push({
      label: "G. total",
      value: amount(liveExtras.pre_round_grand_total, "G. total"),
    });
  }
  if (liveExtras?.round_off_amount != null) {
    rows.push({
      label: "Round off",
      value: amount(liveExtras.round_off_amount, "Round off"),
    });
  }
  rows.push({
    label: netLabel,
    value: amount(netAmount, netLabel),
  });
  rows.push(
    {
      label: amountLabels?.foreign ?? "Foreign amount",
      value: amount(totals.foreign_amount, amountLabels?.foreign ?? "Foreign amount"),
    },
    {
      label: amountLabels?.base ?? "Base amount",
      value: formatMoney(totals.base_amount, baseCode),
    },
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
        {rateProps?.rateStatusMessage ? (
          <p className="text-muted-foreground mt-3 text-sm">{rateProps.rateStatusMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
