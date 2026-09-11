"use client";

import type { QuantityProgress } from "@/shared/components/document/schemas";
import { formatDecimal } from "@/shared/lib/format";

export function QuantityProgressStrip({
  progress,
  fulfilledLabel,
  remainingFulfillLabel,
}: {
  progress: QuantityProgress;
  fulfilledLabel: string;
  remainingFulfillLabel: string;
}) {
  const items = [
    { label: "Ordered", value: progress.ordered },
    { label: fulfilledLabel, value: progress.fulfilled },
    { label: "Invoiced", value: progress.invoiced },
    { label: remainingFulfillLabel, value: progress.remaining_to_fulfill },
    { label: "Remaining to invoice", value: progress.remaining_to_invoice },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">{item.label}</dt>
          <dd className="text-sm tabular-nums">{formatDecimal(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
