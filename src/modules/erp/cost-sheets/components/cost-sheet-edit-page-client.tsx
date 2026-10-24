"use client";

import { CostSheetEntryScreen } from "@/modules/erp/cost-sheets/components/cost-sheet-entry-screen";
import { useCostSheet } from "@/modules/erp/cost-sheets/queries";
import { DataTableError } from "@/shared/components/data-table/states";
import { getErrorMessage } from "@/shared/api/errors";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function CostSheetEditPageClient({ id }: { id: string }) {
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

  return <CostSheetEntryScreen sheet={query.data} />;
}
