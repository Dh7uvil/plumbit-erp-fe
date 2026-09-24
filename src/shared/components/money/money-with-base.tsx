"use client";

import { formatMoney } from "@/shared/lib/format";

export function shouldShowBaseCurrencyLine(
  currencyCode: string,
  baseCurrencyCode: string | null | undefined,
  baseAmount: string | null | undefined,
): boolean {
  return Boolean(
    baseAmount &&
      baseCurrencyCode &&
      currencyCode &&
      baseCurrencyCode !== currencyCode,
  );
}

export function MoneyWithBase({
  amount,
  currencyCode,
  baseAmount,
  baseCurrencyCode,
  className,
}: {
  amount: string | null | undefined;
  currencyCode: string;
  baseAmount?: string | null;
  baseCurrencyCode?: string | null;
  className?: string;
}) {
  const showBase = shouldShowBaseCurrencyLine(currencyCode, baseCurrencyCode, baseAmount);

  return (
    <div className={className}>
      <div className="tabular-nums">{formatMoney(amount, currencyCode)}</div>
      {showBase ? (
        <div className="text-muted-foreground text-xs tabular-nums">
          {formatMoney(baseAmount, baseCurrencyCode ?? "")}
        </div>
      ) : null}
    </div>
  );
}
