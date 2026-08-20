"use client";

import { Button } from "@/shared/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </body>
    </html>
  );
}
