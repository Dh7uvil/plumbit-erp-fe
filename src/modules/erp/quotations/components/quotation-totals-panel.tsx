"use client";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import type { Quotation } from "@/modules/erp/quotations/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatMoney } from "@/shared/lib/format";

export function QuotationTotalsPanel({ quotation }: { quotation: Quotation }) {
  const currenciesQuery = useAllCurrencies();
  const currencies = currenciesQuery.data ?? [];
  const currency = currencies.find((item) => item.id === quotation.currency_id);
  const baseCurrency = currencies.find((item) => item.id === quotation.base_currency_id);
  const code = currency?.code ?? "";
  const baseCode = baseCurrency?.code ?? "";

  const rows = [
    { label: "Subtotal", value: formatMoney(quotation.subtotal, code) },
    { label: "Discount", value: formatMoney(quotation.discount_amount, code) },
    { label: "Tax", value: formatMoney(quotation.tax_amount, code) },
    { label: "Grand total", value: formatMoney(quotation.grand_total, code) },
    { label: "Foreign amount", value: formatMoney(quotation.foreign_amount, code) },
    { label: "Base amount", value: formatMoney(quotation.base_amount, baseCode) },
    {
      label: `Exchange rate${code && baseCode ? ` (${code}/${baseCode})` : ""}`,
      value: formatMoney(quotation.exchange_rate, code || baseCode),
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
