"use client";

import { DataTableError } from "@/shared/components/data-table/states";

export default function TasksError({ reset }: { reset: () => void }) {
  return <DataTableError message="Could not load tasks." onRetry={reset} />;
}
