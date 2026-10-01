"use client";

import { ErrorState } from "@/shared/components/feedback/error-state";

export function CommErrorState({
  message = "Communication is unavailable. Check your permissions and try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return <ErrorState message={message} onRetry={onRetry} />;
}
