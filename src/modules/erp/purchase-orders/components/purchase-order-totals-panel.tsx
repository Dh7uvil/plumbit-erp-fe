"use client";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import type { PurchaseOrder } from "@/modules/erp/purchase-orders/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDecimal, formatMoney } from "@/shared/lib/format";

export function PurchaseOrderTotalsPanel({ purchaseOrder }: { purchaseOrder: PurchaseOrder }) {
  const currenciesQuery = useAllCurrencies();
  const currencies = currenciesQuery.data ?? [];
  const currency = currencies.find((item) => item.id === purchaseOrder.currency_id);
  const baseCurrency = currencies.find((item) => item.id === purchaseOrder.base_currency_id);
  const code = currency?.code ?? "";
  const baseCode = baseCurrency?.code ?? "";

  const rows = [
    { label: "Subtotal", value: formatMoney(purchaseOrder.subtotal, code) },
    { label: "Discount", value: formatMoney(purchaseOrder.discount_amount, code) },
    { label: "Tax", value: formatMoney(purchaseOrder.tax_amount, code) },
    { label: "Grand total", value: formatMoney(purchaseOrder.grand_total, code) },
    { label: "Foreign amount", value: formatMoney(purchaseOrder.foreign_amount, code) },
    { label: "Base amount", value: formatMoney(purchaseOrder.base_amount, baseCode) },
    {
      label: `Exchange rate${code && baseCode ? ` (${code}/${baseCode})` : ""}`,
      value: purchaseOrder.exchange_rate ? formatDecimal(purchaseOrder.exchange_rate) : "—",
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
