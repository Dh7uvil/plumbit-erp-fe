/** Display labels for sales documents (enum values unchanged). */

export const SALES_TAX_TREATMENT_DISPLAY_LABELS: Record<string, string> = {
  REGISTERED: "Domestic Taxable Supplies @5%",
  UNREGISTERED: "Unregistered",
  EXPORT: "Export (Zero-rated)",
  GCC: "GCC",
  EXEMPT: "Exempt",
};

export const PAYMENT_MODES = ["CASH", "CREDIT", "BANK"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  CASH: "Cash",
  CREDIT: "Credit",
  BANK: "Bank",
};

export const PRICE_BASIS_OPTIONS = ["DEFAULT", "PRICE_1", "PRICE_2"] as const;
export type PriceBasis = (typeof PRICE_BASIS_OPTIONS)[number];

export const PRICE_BASIS_LABELS: Record<PriceBasis, string> = {
  DEFAULT: "Def. Sale Price",
  PRICE_1: "Price 1",
  PRICE_2: "Price 2",
};

export function registrationTypeLabel(taxTreatment: string): string {
  if (taxTreatment === "REGISTERED" || taxTreatment === "UNREGISTERED") {
    return taxTreatment === "REGISTERED" ? "Registered" : "Unregistered";
  }
  return taxTreatment;
}

export function periodFromDate(isoDate: string | null | undefined): number | null {
  if (!isoDate || isoDate.length < 7) {
    return null;
  }
  const month = Number(isoDate.slice(5, 7));
  return Number.isFinite(month) ? month : null;
}
