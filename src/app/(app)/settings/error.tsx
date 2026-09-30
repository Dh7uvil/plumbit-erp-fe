"use client";

import { DataTableError } from "@/shared/components/data-table/states";

export default function SettingsError({ reset }: { reset: () => void }) {
  return <DataTableError message="Could not load settings." onRetry={reset} />;
}
