"use client";

import Link from "next/link";

import { PrintDocumentView } from "@/shared/components/document/print-document-view";
import { DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getErrorMessage } from "@/shared/api/errors";
import { isPrintableResource, printApi, type PrintableResource } from "@/shared/lib/print";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";
import { useQuery } from "@tanstack/react-query";

export function PrintDocumentScreen({ resource, id }: { resource: string; id: string }) {
  const printable = isPrintableResource(resource);
  const printQuery = useQuery({
    queryKey: useTenantQueryKey(["print", resource, id]),
    queryFn: () => printApi.get(resource as PrintableResource, id),
    enabled: printable,
  });

  if (!printable) {
    return <p className="text-muted-foreground p-6 text-sm">This document cannot be printed.</p>;
  }

  if (printQuery.isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (printQuery.isError || !printQuery.data) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <DataTableError
          message={printQuery.error ? getErrorMessage(printQuery.error) : "Print data not found"}
          onRetry={() => printQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href={`/${resource}/${id}`}>Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-screen print:bg-white">
      <div className="flex justify-end gap-2 p-4 print:hidden">
        <Button type="button" onClick={() => window.print()}>
          Print
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/${resource}/${id}`}>Back</Link>
        </Button>
      </div>
      <PrintDocumentView document={printQuery.data} />
    </div>
  );
}
