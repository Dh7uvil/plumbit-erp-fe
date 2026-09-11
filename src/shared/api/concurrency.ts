import { randomUuid } from "@/shared/lib/uuid";

export function ifMatchHeaders(
  version: number,
  extra?: { creditOverride?: string | null },
): HeadersInit {
  const headers: Record<string, string> = { "If-Match": String(version) };
  const override = extra?.creditOverride?.trim();
  if (override) {
    headers["X-Credit-Override"] = override;
  }
  return headers;
}

export function postDocumentHeaders(
  version: number,
  idempotencyKey = randomUuid(),
  extra?: { creditOverride?: string | null },
): HeadersInit {
  return {
    ...ifMatchHeaders(version, extra),
    "Idempotency-Key": idempotencyKey,
  };
}
