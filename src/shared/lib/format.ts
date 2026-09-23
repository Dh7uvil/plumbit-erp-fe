export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function parseDecimalParts(value: string): { negative: boolean; whole: string; fraction: string } {
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = trimmed.replace(/^[+-]/, "");
  const [wholeRaw = "0", fraction = ""] = unsigned.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  if (!/^\d+$/.test(whole) || (fraction.length > 0 && !/^\d+$/.test(fraction))) {
    throw new Error("invalid decimal");
  }
  return { negative, whole, fraction };
}

function isZeroParts(whole: string, fraction: string): boolean {
  return whole === "0" && !/[1-9]/.test(fraction);
}

function signedGrouped(negative: boolean, whole: string, fraction: string): string {
  const grouped = new Intl.NumberFormat(undefined, { useGrouping: true }).format(BigInt(whole));
  const sign = negative && !isZeroParts(whole, fraction) ? "-" : "";
  return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}

function roundHalfUp(
  whole: string,
  fraction: string,
  fractionDigits: number,
): { whole: string; fraction: string } {
  const padded = fraction.padEnd(Math.max(fractionDigits, 0) + 1, "0");
  const kept = padded.slice(0, fractionDigits);
  const nextDigit = padded[fractionDigits] ?? "0";
  if (nextDigit < "5") {
    return { whole, fraction: kept };
  }
  if (fractionDigits === 0) {
    return { whole: (BigInt(whole) + BigInt(1)).toString(), fraction: "" };
  }
  const digits = `${whole}${kept}`;
  const incremented = (BigInt(digits) + BigInt(1)).toString();
  if (incremented.length > digits.length) {
    return {
      whole: incremented.slice(0, incremented.length - fractionDigits),
      fraction: incremented.slice(-fractionDigits),
    };
  }
  const paddedIncremented = incremented.padStart(digits.length, "0");
  return {
    whole: paddedIncremented.slice(0, paddedIncremented.length - fractionDigits) || "0",
    fraction: paddedIncremented.slice(-fractionDigits),
  };
}

export function formatFixedDecimal(value: string | null | undefined, fractionDigits = 2): string {
  if (value == null || value === "") {
    return "—";
  }
  try {
    const { negative, whole, fraction } = parseDecimalParts(value);
    const rounded = roundHalfUp(whole, fraction, fractionDigits);
    return signedGrouped(negative, rounded.whole, rounded.fraction);
  } catch {
    return value;
  }
}

export function formatDecimal(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }
  try {
    const { negative, whole, fraction } = parseDecimalParts(value);
    return signedGrouped(negative, whole, fraction);
  } catch {
    return value;
  }
}

export function formatQuantity(value: string | null | undefined): string {
  return formatFixedDecimal(value, 2);
}

/** Formats embedded qty values in tracker summaries such as "1 lines · qty 2.000000". */
export function formatQuantitySummary(summary: string | null | undefined): string {
  if (summary == null || summary === "") {
    return "";
  }
  return summary.replace(
    /qty\s+(-?\d+(?:\.\d+)?)/gi,
    (_match, qty: string) => `qty ${formatQuantity(qty)}`,
  );
}

export function formatPercent(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }
  try {
    parseDecimalParts(value);
  } catch {
    return value;
  }
  return `${formatFixedDecimal(value, 2)}%`;
}

export function normalizeDecimalInput(value: string, fractionDigits = 2): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }
  try {
    const { negative, whole, fraction } = parseDecimalParts(trimmed);
    const rounded = roundHalfUp(whole, fraction, fractionDigits);
    const sign = negative && !isZeroParts(rounded.whole, rounded.fraction) ? "-" : "";
    if (fractionDigits === 0) {
      return `${sign}${rounded.whole}`;
    }
    return `${sign}${rounded.whole}.${rounded.fraction}`;
  } catch {
    return value;
  }
}

export function isZeroDecimal(value: string | null | undefined): boolean {
  if (value == null || value === "") {
    return true;
  }
  try {
    const { whole, fraction } = parseDecimalParts(value);
    return whole === "0" && !/[1-9]/.test(fraction);
  } catch {
    return false;
  }
}

const MONEY_SCALE = 4;
const MONEY_FACTOR = BigInt(10) ** BigInt(MONEY_SCALE);

function toScaledMoney(value: string): bigint | null {
  if (value.trim() === "") {
    return null;
  }
  try {
    const { negative, whole, fraction } = parseDecimalParts(value);
    const padded = (fraction + "0".repeat(MONEY_SCALE)).slice(0, MONEY_SCALE);
    const scaled = BigInt(whole) * MONEY_FACTOR + BigInt(padded || "0");
    return negative ? -scaled : scaled;
  } catch {
    return null;
  }
}

function fromScaledMoney(value: bigint, fractionDigits = MONEY_SCALE): string {
  const negative = value < BigInt(0);
  const abs = negative ? -value : value;
  const whole = abs / MONEY_FACTOR;
  const fraction = (abs % MONEY_FACTOR).toString().padStart(MONEY_SCALE, "0");
  const rounded = roundHalfUp(whole.toString(), fraction, fractionDigits);
  const sign = negative && !isZeroParts(rounded.whole, rounded.fraction) ? "-" : "";
  if (fractionDigits === 0) {
    return `${sign}${rounded.whole}`;
  }
  return `${sign}${rounded.whole}.${rounded.fraction}`;
}

export function multiplyDecimals(
  left: string,
  right: string,
  fractionDigits = MONEY_SCALE,
): string | null {
  const scaledLeft = toScaledMoney(left);
  const scaledRight = toScaledMoney(right);
  if (scaledLeft === null || scaledRight === null) {
    return null;
  }
  const product = scaledLeft * scaledRight;
  const extra = MONEY_FACTOR;
  const half = extra / BigInt(2);
  const negative = product < BigInt(0);
  const abs = negative ? -product : product;
  const rounded = (abs + half) / extra;
  return fromScaledMoney(negative ? -rounded : rounded, fractionDigits);
}

export function subtractDecimals(
  left: string,
  right: string,
  fractionDigits = MONEY_SCALE,
): string | null {
  const scaledLeft = toScaledMoney(left);
  const scaledRight = toScaledMoney(right);
  if (scaledLeft === null || scaledRight === null) {
    return null;
  }
  return fromScaledMoney(scaledLeft - scaledRight, fractionDigits);
}

export function compareDecimals(left: string, right: string): number | null {
  const scaledLeft = toScaledMoney(left);
  const scaledRight = toScaledMoney(right);
  if (scaledLeft === null || scaledRight === null) {
    return null;
  }
  if (scaledLeft === scaledRight) {
    return 0;
  }
  return scaledLeft < scaledRight ? -1 : 1;
}

export function proportionDecimal(part: string, whole: string, total: string): string | null {
  const scaledPart = toScaledMoney(part);
  const scaledWhole = toScaledMoney(whole);
  const scaledTotal = toScaledMoney(total);
  if (scaledPart === null || scaledWhole === null || scaledTotal === null || scaledWhole === BigInt(0)) {
    return null;
  }
  const negative = scaledPart < BigInt(0) !== scaledTotal < BigInt(0);
  const absPart = scaledPart < BigInt(0) ? -scaledPart : scaledPart;
  const absWhole = scaledWhole < BigInt(0) ? -scaledWhole : scaledWhole;
  const absTotal = scaledTotal < BigInt(0) ? -scaledTotal : scaledTotal;
  const result = (absPart * absTotal) / absWhole;
  return fromScaledMoney(negative ? -result : result);
}

export function formatReportMoney(
  value: string | null | undefined,
  currencyCode?: string | null,
): string {
  if (!currencyCode && process.env.NODE_ENV === "development") {
    console.warn("formatReportMoney called without currency_code");
  }
  return formatMoney(value, currencyCode ?? "");
}

export function formatCompactReportMoney(
  value: string | null | undefined,
  currencyCode?: string | null,
): string {
  if (value == null || value === "") {
    return "—";
  }
  try {
    const { whole } = parseDecimalParts(value);
    if (whole.length < 6) {
      return formatReportMoney(value, currencyCode);
    }
    const currency = currencyCode ?? "";
    if (!currency) {
      return formatDecimal(value);
    }
    const rounded = formatFixedDecimal(value, 2).replace(/,/g, "");
    const numeric = Number(rounded);
    if (!Number.isFinite(numeric)) {
      return formatReportMoney(value, currencyCode);
    }
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(numeric);
  } catch {
    return formatReportMoney(value, currencyCode);
  }
}

export function formatMoney(
  value: string | null | undefined,
  currencyCode: string,
  fractionDigitsOverride?: number,
): string {
  if (value == null || value === "") {
    return "—";
  }
  const currency = currencyCode || "";
  try {
    const { negative, whole, fraction } = parseDecimalParts(value);
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      ...(fractionDigitsOverride == null
        ? {}
        : {
            minimumFractionDigits: fractionDigitsOverride,
            maximumFractionDigits: fractionDigitsOverride,
          }),
    });
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    const rounded = roundHalfUp(whole, fraction, fractionDigits);
    const groupedWhole = new Intl.NumberFormat(undefined, { useGrouping: true }).format(
      BigInt(rounded.whole),
    );
    const paddedFraction = rounded.fraction;
    const showNegative = negative && !isZeroParts(rounded.whole, rounded.fraction);
    const parts = formatter.formatToParts(showNegative ? -1 : 1);
    return parts
      .map((part) => {
        if (part.type === "integer") {
          return groupedWhole;
        }
        if (part.type === "group") {
          return "";
        }
        if (part.type === "fraction") {
          return paddedFraction;
        }
        return part.value;
      })
      .join("");
  } catch {
    return currencyCode ? `${currencyCode} ${value}` : value;
  }
}

export function titleCase(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function humanizeEnum(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
