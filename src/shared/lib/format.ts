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

export function formatDecimal(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }
  try {
    const { negative, whole, fraction } = parseDecimalParts(value);
    const grouped = new Intl.NumberFormat(undefined, { useGrouping: true }).format(BigInt(whole));
    const sign = negative && whole !== "0" ? "-" : "";
    return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
  } catch {
    return value;
  }
}

export function formatMoney(value: string | null | undefined, currencyCode: string): string {
  if (value == null || value === "") {
    return "—";
  }
  const currency = currencyCode || "AED";
  try {
    const { negative, whole, fraction } = parseDecimalParts(value);
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    });
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    const paddedFraction = (fraction + "0".repeat(fractionDigits)).slice(0, fractionDigits);
    const groupedWhole = new Intl.NumberFormat(undefined, { useGrouping: true }).format(
      BigInt(whole),
    );
    const parts = formatter.formatToParts(negative && whole !== "0" ? -1 : 1);
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
