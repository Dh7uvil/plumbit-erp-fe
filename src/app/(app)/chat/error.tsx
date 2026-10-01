"use client";

import { CommErrorState } from "@/modules/communication/components/ui";

export default function ChatError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
      <CommErrorState
        message="Something went wrong loading chat. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
