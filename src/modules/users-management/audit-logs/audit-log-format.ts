export type FormattedAuditValue =
  | { kind: "empty" }
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "json"; text: string };

function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

const DECIMAL_STRING = /^-?\d+\.\d+$/;

function formatDecimalish(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  const trimmed = fraction.replace(/0+$/, "");
  if (!trimmed) {
    return `${whole}.00`;
  }
  if (trimmed.length === 1) {
    return `${whole}.${trimmed}0`;
  }
  return `${whole}.${trimmed}`;
}

function formatPrimitive(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const asString = String(value);
    return DECIMAL_STRING.test(asString) ? formatDecimalish(asString) : asString;
  }
  if (typeof value === "string" && DECIMAL_STRING.test(value)) {
    return formatDecimalish(value);
  }
  return String(value);
}

function stringifyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatAuditValue(value: unknown): FormattedAuditValue {
  if (value === null || value === undefined) {
    return { kind: "empty" };
  }
  if (isPrimitive(value)) {
    return { kind: "text", text: formatPrimitive(value) };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { kind: "empty" };
    }
    if (value.every(isPrimitive)) {
      return { kind: "list", items: value.map(formatPrimitive) };
    }
    return { kind: "json", text: stringifyJson(value) };
  }
  if (typeof value === "object") {
    return { kind: "json", text: stringifyJson(value) };
  }
  return { kind: "text", text: String(value) };
}

export function humanizeAuditField(field: string): string {
  const spaced = field.replaceAll("_", " ").trim().toLowerCase();
  if (!spaced) {
    return field;
  }
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
