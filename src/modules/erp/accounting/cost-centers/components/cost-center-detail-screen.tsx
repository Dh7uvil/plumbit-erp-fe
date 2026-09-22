"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CostCenterForm } from "@/modules/erp/accounting/cost-centers/components/cost-center-form";
import { costCenterPermissions } from "@/modules/erp/accounting/cost-centers/permissions";
import { useCostCenter } from "@/modules/erp/accounting/cost-centers/queries";
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

export function CostCenterDetailScreen({ termId, mode }: { termId: string; mode: RecordPageMode }) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(costCenterPermissions);
  const termQuery = useCostCenter(termId);
  const term = termQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/cost-centers/${termId}`;

  if (termQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (termQuery.isError || !term) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={termQuery.error ? getErrorMessage(termQuery.error) : "Cost center not found"}
          onRetry={() => termQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/cost-centers">Back to cost centers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={term.name}
        listHref="/cost-centers"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit cost center" : "Cost center"}</CardTitle>
        </CardHeader>
        <CardContent>
          <CostCenterForm
            costCenter={term}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
