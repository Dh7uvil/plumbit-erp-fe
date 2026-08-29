"use client";

import { Button } from "@/shared/components/ui/button";

export default function CurrenciesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Unable to load currencies</h2>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
