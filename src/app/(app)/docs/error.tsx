"use client";

import { DataTableError } from "@/shared/components/data-table/states";

export default function DocsError({ reset }: { reset: () => void }) {
  return <DataTableError message="Could not load documentation." onRetry={reset} />;
}
