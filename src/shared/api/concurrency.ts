export function ifMatchHeaders(version: number): HeadersInit {
  return { "If-Match": String(version) };
}
