"use client";

import { useQuery } from "@tanstack/react-query";

import { exchangeRatesApi } from "@/modules/erp/exchange-rates/api";
import { formatMoney, isZeroDecimal, multiplyDecimals } from "@/shared/lib/format";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function baseEquivalentPreviewMessage(params: {
  sameCurrency: boolean;
  hasAmount: boolean;
  isLoading: boolean;
  isError: boolean;
  rate: string | null | undefined;
}): string | null {
  if (params.sameCurrency || !params.hasAmount) {
    return null;
  }
  if (params.isLoading) {
    return "Resolving exchange rate…";
  }
  if (params.isError || !params.rate) {
    return "No exchange rate for this date.";
  }
  return null;
}

export function computeBaseEquivalentAmount(
  amount: string,
  rate: string,
): string | null {
  return multiplyDecimals(amount, rate);
}

export function BaseEquivalentPreview({
  amount,
  currencyId,
  baseCurrencyId,
  baseCurrencyCode,
  documentDate,
  className,
}: {
  amount: string | null | undefined;
  currencyId: string | null | undefined;
  baseCurrencyId: string | null | undefined;
  baseCurrencyCode?: string | null;
  documentDate: string | null | undefined;
  className?: string;
}) {
  const sameCurrency = !currencyId || !baseCurrencyId || currencyId === baseCurrencyId;
  const hasAmount = Boolean(amount && !isZeroDecimal(amount));
  const resolveKey = useTenantQueryKey([
    "exchange-rate-resolve",
    currencyId ?? "",
    baseCurrencyId ?? "",
    documentDate ?? "",
  ]);

  const resolveQuery = useQuery({
    queryKey: resolveKey,
    queryFn: () =>
      exchangeRatesApi.resolve({
        from_currency_id: currencyId!,
        to_currency_id: baseCurrencyId!,
        on_date: documentDate!,
      }),
    enabled: Boolean(!sameCurrency && currencyId && baseCurrencyId && documentDate && hasAmount),
  });

  const message = baseEquivalentPreviewMessage({
    sameCurrency,
    hasAmount,
    isLoading: resolveQuery.isLoading,
    isError: resolveQuery.isError,
    rate: resolveQuery.data?.rate,
  });

  if (sameCurrency || !hasAmount) {
    return null;
  }

  if (message) {
    return <p className={`text-muted-foreground text-sm ${className ?? ""}`.trim()}>{message}</p>;
  }

  const baseAmount = computeBaseEquivalentAmount(amount!, resolveQuery.data!.rate);
  if (!baseAmount) {
    return (
      <p className={`text-muted-foreground text-sm ${className ?? ""}`.trim()}>
        No exchange rate for this date.
      </p>
    );
  }

  return (
    <p className={`text-muted-foreground text-sm ${className ?? ""}`.trim()}>
      Base equivalent {formatMoney(baseAmount, baseCurrencyCode ?? "")}
      {resolveQuery.data?.is_derived_reciprocal ? " (derived reciprocal)" : ""}
    </p>
  );
}
