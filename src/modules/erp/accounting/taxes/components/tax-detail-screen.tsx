"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TaxForm } from "@/modules/erp/accounting/taxes/components/tax-form";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { useTax } from "@/modules/erp/accounting/taxes/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function TaxDetailScreen({ taxId, mode }: { taxId: string; mode: RecordPageMode }) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(taxPermissions);
  const taxQuery = useTax(taxId);
  const tax = taxQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/taxes/${taxId}`;

  if (taxQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (taxQuery.isError || !tax) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={taxQuery.error ? getErrorMessage(taxQuery.error) : "Tax not found"}
          onRetry={() => taxQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/taxes">Back to taxes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={tax.name}
        listHref="/taxes"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit tax" : "Tax"}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaxForm tax={tax} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
        </CardContent>
      </Card>
    </div>
  );
}
