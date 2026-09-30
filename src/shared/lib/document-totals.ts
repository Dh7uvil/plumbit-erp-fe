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
