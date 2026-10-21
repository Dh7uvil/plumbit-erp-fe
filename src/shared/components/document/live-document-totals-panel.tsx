"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
import { DocumentTotalsPanel } from "@/shared/components/document/document-totals-panel";
import type { DocumentTotals } from "@/shared/components/document/schemas";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import {
  useLiveDocumentTotals,
  type CommercialLineForTotals,
} from "@/shared/hooks/use-live-document-totals";
import {
  documentTotalsRateStatusMessage,
  savedDocumentDateFromRecord,
  useResolvedExchangeRate,
} from "@/shared/hooks/use-resolved-exchange-rate";
import type { RoundOffRule } from "@/shared/lib/document-totals";

type CommercialTotalsForm = {
  lines: CommercialLineForTotals[];
  discount_type?: string | null;
  discount_value?: string | null;
  shipping_amount?: string | null;
  adjustment_amount?: string | null;
  prices_include_tax?: boolean;
  currency_id: string;
  base_currency_id?: string | null;
  exchange_rate?: string | null;
};

export function LiveDocumentTotalsPanel<T extends FieldValues & CommercialTotalsForm>({
  form,
  currencies,
  savedTotals,
  roundOffRule = "NONE",
  documentDate,
  amountLabels,
}: {
  form: UseFormReturn<T>;
  currencies: readonly { id: string; code: string }[];
  savedTotals?: DocumentTotals | null;
  roundOffRule?: RoundOffRule;
  documentDate?: string | null;
  amountLabels?: { foreign?: string; base?: string };
}) {
  const taxesQuery = useAllTaxes();
  const taxes = taxesQuery.data ?? [];
  const { baseCurrencyId: orgBaseCurrencyId, baseCurrencyCode } = useBaseCurrency();
  const lines = useWatch({ control: form.control, name: "lines" as Path<T> }) as
    | CommercialLineForTotals[]
    | undefined;
  const discountType = useWatch({
    control: form.control,
    name: "discount_type" as Path<T>,
  }) as string | null | undefined;
  const discountValue = useWatch({
    control: form.control,
    name: "discount_value" as Path<T>,
  }) as string | null | undefined;
  const shippingAmount = useWatch({
    control: form.control,
    name: "shipping_amount" as Path<T>,
  }) as string | null | undefined;
  const adjustmentAmount = useWatch({
    control: form.control,
    name: "adjustment_amount" as Path<T>,
  }) as string | null | undefined;
  const pricesIncludeTax = useWatch({
    control: form.control,
    name: "prices_include_tax" as Path<T>,
  }) as boolean | undefined;
  const currencyId = useWatch({ control: form.control, name: "currency_id" as Path<T> }) as string;
  const baseCurrencyId = useWatch({
    control: form.control,
    name: "base_currency_id" as Path<T>,
  }) as string | null | undefined;
  const exchangeRate = useWatch({
    control: form.control,
    name: "exchange_rate" as Path<T>,
  }) as string | null | undefined;

  const normalizedCurrencyId =
    currencyId && currencyId !== OPTIONAL_SELECT_NONE ? currencyId : null;

  const baseId =
    (baseCurrencyId && baseCurrencyId !== OPTIONAL_SELECT_NONE ? baseCurrencyId : null) ??
    savedTotals?.base_currency_id ??
    orgBaseCurrencyId ??
    normalizedCurrencyId ??
    currencyId;

  const savedDate =
    savedDocumentDateFromRecord(savedTotals as Record<string, unknown> | null | undefined) ??
    null;

  const resolved = useResolvedExchangeRate({
    currencyId: normalizedCurrencyId,
    baseCurrencyId: baseId,
    documentDate: documentDate?.trim() || null,
    savedRate: savedTotals?.exchange_rate,
    savedCurrencyId: savedTotals?.currency_id,
    savedDate,
  });

  const formRate = exchangeRate?.trim() || null;
  const effectiveExchangeRate =
    formRate ??
    (resolved.sameCurrency ? "1" : resolved.rate) ??
    savedTotals?.exchange_rate ??
    "1";

  const live = useLiveDocumentTotals({
    lines: lines ?? [],
    taxes,
    discountType: discountType === OPTIONAL_SELECT_NONE ? null : discountType,
    discountValue,
    shippingAmount,
    adjustmentAmount,
    pricesIncludeTax,
    roundOffRule,
    exchangeRate: effectiveExchangeRate,
  });

  const totals: DocumentTotals = {
    subtotal: live.subtotal,
    discount_amount: live.discount_amount,
    tax_amount: live.tax_amount,
    grand_total: live.net_total,
    foreign_amount: live.foreign_amount,
    base_amount: live.base_amount,
    exchange_rate: effectiveExchangeRate,
    currency_id: currencyId,
    base_currency_id: baseId,
  };

  const rateStatusMessage = documentTotalsRateStatusMessage({
    sameCurrency: resolved.sameCurrency,
    isLoading: resolved.isLoading,
    isError: resolved.isError,
    rate: formRate ?? resolved.rate,
  });

  const showDualCurrency = Boolean(
    !resolved.sameCurrency &&
      !resolved.isLoading &&
      !resolved.isError &&
      (formRate ?? resolved.rate),
  );

  return (
    <DocumentTotalsPanel
      totals={totals}
      currencies={currencies}
      amountLabels={amountLabels}
      liveExtras={{
        taxable_amount: live.taxable_amount,
        shipping_amount: live.shipping_amount,
        pre_round_grand_total: live.grand_total,
        round_off_amount: live.round_off_amount,
        net_total: live.net_total,
      }}
      rateProps={{
        exchangeRate: showDualCurrency ? effectiveExchangeRate : undefined,
        baseCurrencyCode: baseCurrencyCode ?? undefined,
        sameCurrency: resolved.sameCurrency,
        rateStatusMessage:
          documentDate !== undefined || savedTotals ? rateStatusMessage : null,
      }}
    />
  );
}
