"use client";

import { useAllPaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { formatDecimal, formatMoney } from "@/shared/lib/format";

export function AppliedCommercialTerms({
  currencyId,
  exchangeRate,
  taxTreatmentLabel,
  paymentTermsId,
  baseAmount,
  isDerivedReciprocal = false,
}: {
  currencyId: string;
  exchangeRate: string;
  taxTreatmentLabel: string;
  paymentTermsId?: string | null;
  baseAmount?: string | null;
  isDerivedReciprocal?: boolean;
}) {
  const currenciesQuery = useAllCurrencies();
  const paymentTermsQuery = useAllPaymentTerms();
  const { baseCurrencyCode } = useBaseCurrency();
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === currencyId)?.code ?? "";
  const paymentTermsName = paymentTermsId
    ? (paymentTermsQuery.data?.find((term) => term.id === paymentTermsId)?.name ?? null)
    : null;

  const items = [
    { label: "Currency", value: currencyCode || null },
    {
      label: "Rate",
      value: exchangeRate
        ? `${formatDecimal(exchangeRate)}${isDerivedReciprocal ? " (derived reciprocal)" : ""}`
        : null,
    },
    {
      label: "Base total",
      value: baseAmount ? formatMoney(baseAmount, baseCurrencyCode ?? "") : null,
    },
    { label: "Tax", value: taxTreatmentLabel },
    { label: "Payment terms", value: paymentTermsName },
  ].filter((item) => item.value);

  if (items.length === 0) {
    return null;
  }

  return (
    <dl className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex gap-1">
          <dt>{item.label}</dt>
          <dd className="text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
