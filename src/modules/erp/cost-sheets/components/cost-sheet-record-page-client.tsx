"use client";

import { CostSheetDetailScreen } from "@/modules/erp/cost-sheets/components/cost-sheet-detail-screen";
import { CostSheetEntryScreen } from "@/modules/erp/cost-sheets/components/cost-sheet-entry-screen";
import { useCostSheet } from "@/modules/erp/cost-sheets/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function CostSheetRecordPageClient({
  id,
  readOnly,
}: {
  id: string;
  readOnly: boolean;
}) {
  const query = useCostSheet(id);

  if (query.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (query.isError) {
    return (
      <DataTableError
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (!query.data) {
    return <p className="text-muted-foreground text-sm">Cost sheet not found.</p>;
  }

  if (query.data.sheet_mode === "PLANNING") {
    return <CostSheetDetailScreen id={id} />;
  }

  const locked =
    query.data.status === "CLOSED" ||
    (readOnly && query.data.sheet_mode !== "JOURNAL");

  return <CostSheetEntryScreen sheet={query.data} readOnly={locked} />;
}
