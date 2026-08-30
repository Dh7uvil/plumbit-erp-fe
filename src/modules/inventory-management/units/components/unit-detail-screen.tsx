"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { UnitForm } from "@/modules/inventory-management/units/components/unit-form";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { useUnit } from "@/modules/inventory-management/units/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { RecordCode } from "@/shared/components/form/record-code";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function UnitDetailScreen({ unitId, mode }: { unitId: string; mode: RecordPageMode }) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(unitPermissions);
  const unitQuery = useUnit(unitId);
  const unit = unitQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/units/${unitId}`;

  if (unitQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (unitQuery.isError || !unit) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={unitQuery.error ? getErrorMessage(unitQuery.error) : "Unit not found"}
          onRetry={() => unitQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/units">Back to units</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={unit.name}
        code={unit.code}
        listHref="/units"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{isEdit ? "Edit unit" : "Unit"}</CardTitle>
          <RecordCode entity="Unit" code={unit.code} />
        </CardHeader>
        <CardContent>
          <UnitForm unit={unit} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
        </CardContent>
      </Card>
    </div>
  );
}
