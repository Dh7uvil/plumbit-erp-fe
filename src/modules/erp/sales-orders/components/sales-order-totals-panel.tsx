"use client";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import type { SalesOrder } from "@/modules/erp/sales-orders/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDecimal, formatMoney } from "@/shared/lib/format";

export function SalesOrderTotalsPanel({ salesOrder }: { salesOrder: SalesOrder }) {
  const currenciesQuery = useAllCurrencies();
  const currencies = currenciesQuery.data ?? [];
  const currency = currencies.find((item) => item.id === salesOrder.currency_id);
  const baseCurrency = currencies.find((item) => item.id === salesOrder.base_currency_id);
  const code = currency?.code ?? "";
  const baseCode = baseCurrency?.code ?? "";

  const rows = [
    { label: "Subtotal", value: formatMoney(salesOrder.subtotal, code) },
    { label: "Discount", value: formatMoney(salesOrder.discount_amount, code) },
    { label: "Tax", value: formatMoney(salesOrder.tax_amount, code) },
    { label: "Grand total", value: formatMoney(salesOrder.grand_total, code) },
    { label: "Foreign amount", value: formatMoney(salesOrder.foreign_amount, code) },
    { label: "Base amount", value: formatMoney(salesOrder.base_amount, baseCode) },
    {
      label: `Exchange rate${code && baseCode ? ` (${code}/${baseCode})` : ""}`,
      value: salesOrder.exchange_rate ? formatDecimal(salesOrder.exchange_rate) : "—",
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
