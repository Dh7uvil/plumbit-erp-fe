import { ApiError } from "@/shared/api/errors";

/** Whether a failed send should be queued for offline retry. */
export function isRetriableSendError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("failed to fetch") ||
      message.includes("load failed") ||
      message.includes("econnreset") ||
      message.includes("aborted")
    );
  }
  return false;
}
