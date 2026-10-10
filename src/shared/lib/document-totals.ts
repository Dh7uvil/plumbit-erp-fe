/** Pure document total helpers mirroring backend document_totals.py. No I/O. */

export type DiscountType = "PERCENTAGE" | "AMOUNT" | null | undefined;

const MONEY_FACTOR = 10_000;
const QTY_FACTOR = 1_000_000;
const HUNDRED = 100;

function toNumber(value: string | number | null | undefined): number {
  if (value == null || value === "") {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function quantizeMoney(value: number): string {
  return (Math.round(value * MONEY_FACTOR) / MONEY_FACTOR).toFixed(4);
}

export function quantizeQuantity(value: number): string {
  return (Math.round(value * QTY_FACTOR) / QTY_FACTOR).toFixed(6);
}

export function discountAmount(
  base: number,
  discountType: DiscountType,
  discountValue: string | number | null | undefined,
): string {
  if (discountType == null || discountValue == null || discountValue === "") {
    return quantizeMoney(0);
  }
  const value = toNumber(discountValue);
  if (discountType === "PERCENTAGE") {
    if (value > HUNDRED) {
      throw new Error("Percentage discount cannot exceed 100");
    }
    return quantizeMoney((base * value) / HUNDRED);
  }
  return quantizeMoney(Math.min(value, base));
}

export function computeLineAmounts(input: {
  quantity: string | number;
  rate: string | number;
  discountType?: DiscountType;
  discountValue?: string | number | null;
  taxRate: string | number;
  pricesIncludeTax?: boolean;
}): {
  quantity: string;
  lineDiscount: string;
  taxAmount: string;
  netAmount: string;
} {
  const qty = quantizeQuantity(toNumber(input.quantity));
  const rate = toNumber(input.rate);
  const gross = quantizeMoney(toNumber(qty) * rate);
  const lineDiscount = discountAmount(
    toNumber(gross),
    input.discountType,
    input.discountValue,
  );
  const total = quantizeMoney(toNumber(gross) - toNumber(lineDiscount));
  const taxRate = toNumber(input.taxRate);

  if (input.pricesIncludeTax && taxRate > 0) {
    const net = quantizeMoney((toNumber(total) * HUNDRED) / (HUNDRED + taxRate));
    const tax = quantizeMoney(toNumber(total) - toNumber(net));
    return { quantity: qty, lineDiscount, taxAmount: tax, netAmount: net };
  }

  const net = total;
  const tax = quantizeMoney((toNumber(net) * taxRate) / HUNDRED);
  return { quantity: qty, lineDiscount, taxAmount: tax, netAmount: net };
}

export function headerDiscountShare(
  discountAmountValue: string | number,
  subtotal: string | number,
  lineAmount: string | number,
): string {
  const docDiscount = toNumber(discountAmountValue);
  const subtotalValue = toNumber(subtotal);
  const lineValue = toNumber(lineAmount);
  if (subtotalValue <= 0 || docDiscount === 0) {
    return quantizeMoney(0);
  }
  return quantizeMoney((docDiscount * lineValue) / subtotalValue);
}

export function computeHeaderTotals(input: {
  lineNets: readonly (string | number)[];
  lineTaxes: readonly (string | number)[];
  discountType?: DiscountType;
  discountValue?: string | number | null;
  shippingAmount?: string | number;
  adjustmentAmount?: string | number;
}): {
  subtotal: string;
  docDiscount: string;
  taxTotal: string;
  grandTotal: string;
  adjustment: string;
} {
  const lineNets = input.lineNets.map((value) => toNumber(value));
  const lineTaxes = input.lineTaxes.map((value) => toNumber(value));
  const subtotal = quantizeMoney(lineNets.reduce((sum, value) => sum + value, 0));
  const docDiscount = discountAmount(toNumber(subtotal), input.discountType, input.discountValue);
  const subtotalValue = toNumber(subtotal);
  const taxableRatio =
    subtotalValue > 0 ? (subtotalValue - toNumber(docDiscount)) / subtotalValue : 1;
  const taxTotal = quantizeMoney(
    lineTaxes.reduce((sum, tax) => sum + tax * taxableRatio, 0),
  );
  const shipping = toNumber(input.shippingAmount ?? 0);
  const preAdjustment = quantizeMoney(
    subtotalValue - toNumber(docDiscount) + toNumber(taxTotal) + shipping,
  );
  let adjustment = quantizeMoney(toNumber(input.adjustmentAmount ?? 0));
  const minimumAdjustment = quantizeMoney(-toNumber(preAdjustment));
  if (toNumber(adjustment) < toNumber(minimumAdjustment)) {
    adjustment = minimumAdjustment;
  }
  const grandTotal = quantizeMoney(toNumber(preAdjustment) + toNumber(adjustment));
  return { subtotal, docDiscount, taxTotal, grandTotal, adjustment };
}

export type RoundOffRule = "NONE" | "0.05" | "0.25" | "1.00";

export function applyRoundOff(
  grandTotal: string,
  rule: RoundOffRule,
): { roundOff: string; netTotal: string } {
  const total = toNumber(grandTotal);
  if (rule === "NONE") {
    return { roundOff: quantizeMoney(0), netTotal: grandTotal };
  }
  const step = toNumber(rule);
  const rounded = Math.round(total / step) * step;
  const roundOff = quantizeMoney(rounded - total);
  return { roundOff, netTotal: quantizeMoney(rounded) };
}

export type LiveTotalsLineInput = {
  quantity: string | number;
  rate: string | number;
  discount_type?: DiscountType | string | null;
  discount_value?: string | number | null;
  tax_rate: string | number;
};

export type LiveDocumentTotalsResult = {
  subtotal: string;
  discount_amount: string;
  taxable_amount: string;
  tax_amount: string;
  shipping_amount: string;
  adjustment_amount: string;
  grand_total: string;
  round_off_amount: string;
  net_total: string;
  foreign_amount: string;
  base_amount: string;
};

export function computeLiveDocumentTotals(input: {
  lines: readonly LiveTotalsLineInput[];
  discountType?: DiscountType;
  discountValue?: string | number | null;
  shippingAmount?: string | number;
  adjustmentAmount?: string | number;
  pricesIncludeTax?: boolean;
  roundOffRule?: RoundOffRule;
  exchangeRate?: string | number;
}): LiveDocumentTotalsResult {
  const lineNets: string[] = [];
  const lineTaxes: string[] = [];
  for (const line of input.lines) {
    const amounts = computeLineAmounts({
      quantity: line.quantity,
      rate: line.rate,
      discountType:
        line.discount_type === "PERCENTAGE" || line.discount_type === "AMOUNT"
          ? line.discount_type
          : undefined,
      discountValue: line.discount_value,
      taxRate: line.tax_rate,
      pricesIncludeTax: input.pricesIncludeTax,
    });
    lineNets.push(amounts.netAmount);
    lineTaxes.push(amounts.taxAmount);
  }
  const header = computeHeaderTotals({
    lineNets,
    lineTaxes,
    discountType: input.discountType,
    discountValue: input.discountValue,
    shippingAmount: input.shippingAmount,
    adjustmentAmount: input.adjustmentAmount,
  });
  const shipping = quantizeMoney(toNumber(input.shippingAmount ?? 0));
  const taxable = quantizeMoney(toNumber(header.subtotal) - toNumber(header.docDiscount));
  const { roundOff, netTotal } = applyRoundOff(
    header.grandTotal,
    input.roundOffRule ?? "NONE",
  );
  const rate = toNumber(input.exchangeRate ?? 1);
  const foreign = netTotal;
  const base = quantizeMoney(toNumber(netTotal) * rate);
  return {
    subtotal: header.subtotal,
    discount_amount: header.docDiscount,
    taxable_amount: taxable,
    tax_amount: header.taxTotal,
    shipping_amount: shipping,
    adjustment_amount: header.adjustment,
    grand_total: header.grandTotal,
    round_off_amount: roundOff,
    net_total: netTotal,
    foreign_amount: foreign,
    base_amount: base,
  };
}
