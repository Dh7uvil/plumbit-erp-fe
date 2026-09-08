export function ifMatchHeaders(version: number): HeadersInit {
  return { "If-Match": String(version) };
}

export function postDocumentHeaders(
  version: number,
  idempotencyKey = crypto.randomUUID(),
): HeadersInit {
  return {
    "If-Match": String(version),
    "Idempotency-Key": idempotencyKey,
  };
}
