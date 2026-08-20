const SENSITIVE_KEY = /(password|token|secret|authorization|cookie|email|phone)/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        SENSITIVE_KEY.test(key) ? "[redacted]" : redact(nested),
      ]),
    );
  }
  return value;
}

export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[error-reporting]", error, redact(context));
  }
}
