export function ifMatchHeaders(version: number): HeadersInit {
  return { "If-Match": String(version) };
}

import { randomUuid } from "@/shared/lib/uuid";

export function postDocumentHeaders(
  version: number,
  idempotencyKey = randomUuid(),
): HeadersInit {
  return {
    "If-Match": String(version),
    "Idempotency-Key": idempotencyKey,
  };
}
