"use client";

import { DataTableError } from "@/shared/components/data-table/states";

export default function TaskLabelsError({ reset }: { reset: () => void }) {
  return <DataTableError message="Could not load task labels." onRetry={reset} />;
}
