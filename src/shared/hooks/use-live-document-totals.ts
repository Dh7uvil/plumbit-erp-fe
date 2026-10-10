"use client";

import { useMemo } from "react";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import type { Tax } from "@/modules/erp/accounting/taxes/schemas";
import {
  computeLiveDocumentTotals,
  type DiscountType,
  type LiveDocumentTotalsResult,
  type LiveTotalsLineInput,
  type RoundOffRule,
} from "@/shared/lib/document-totals";

export type CommercialLineForTotals = {
  quantity: string;
  rate: string;
  discount_type?: string | null;
  discount_value?: string | null;
  tax_id?: string | null;
};

export function resolveLineTaxRate(
  line: CommercialLineForTotals,
  taxesById: ReadonlyMap<string, Tax>,
  fallbackRate = "0",
): string {
  const taxId = line.tax_id;
  if (!taxId || taxId === OPTIONAL_SELECT_NONE) {
    return fallbackRate;
  }
  const tax = taxesById.get(taxId);
  return tax?.rate ?? fallbackRate;
}

export function linesToLiveTotalsInput(
  lines: readonly CommercialLineForTotals[],
  taxesById: ReadonlyMap<string, Tax>,
): LiveTotalsLineInput[] {
  return lines.map((line) => ({
    quantity: line.quantity,
    rate: line.rate,
    discount_type: line.discount_type,
    discount_value: line.discount_value,
    tax_rate: resolveLineTaxRate(line, taxesById),
  }));
}

export function useLiveDocumentTotals(input: {
  lines: readonly CommercialLineForTotals[];
  taxes: readonly Tax[];
  discountType?: string | null;
  discountValue?: string | null;
  shippingAmount?: string | null;
  adjustmentAmount?: string | null;
  pricesIncludeTax?: boolean;
  roundOffRule?: RoundOffRule;
  exchangeRate?: string | null;
}): LiveDocumentTotalsResult {
  const taxesById = useMemo(
    () => new Map(input.taxes.map((tax) => [tax.id, tax])),
    [input.taxes],
  );
  return useMemo(() => {
    const discountType =
      input.discountType === "PERCENTAGE" || input.discountType === "AMOUNT"
        ? (input.discountType as DiscountType)
        : undefined;
    return computeLiveDocumentTotals({
      lines: linesToLiveTotalsInput(input.lines, taxesById),
      discountType,
      discountValue: input.discountValue,
      shippingAmount: input.shippingAmount ?? "0",
      adjustmentAmount: input.adjustmentAmount ?? "0",
      pricesIncludeTax: input.pricesIncludeTax,
      roundOffRule: input.roundOffRule,
      exchangeRate: input.exchangeRate ?? "1",
    });
  }, [
    input.adjustmentAmount,
    input.discountType,
    input.discountValue,
    input.exchangeRate,
    input.lines,
    input.pricesIncludeTax,
    input.roundOffRule,
    input.shippingAmount,
    taxesById,
  ]);
}
