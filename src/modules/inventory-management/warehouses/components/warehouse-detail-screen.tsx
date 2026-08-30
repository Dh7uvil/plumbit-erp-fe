"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { WarehouseForm } from "@/modules/inventory-management/warehouses/components/warehouse-form";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { useWarehouse } from "@/modules/inventory-management/warehouses/queries";
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

export function WarehouseDetailScreen({
  warehouseId,
  mode,
}: {
  warehouseId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(warehousePermissions);
  const warehouseQuery = useWarehouse(warehouseId);
  const warehouse = warehouseQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/warehouses/${warehouseId}`;

  if (warehouseQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (warehouseQuery.isError || !warehouse) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            warehouseQuery.error ? getErrorMessage(warehouseQuery.error) : "Warehouse not found"
          }
          onRetry={() => warehouseQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/warehouses">Back to warehouses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={warehouse.name}
        code={warehouse.code}
        listHref="/warehouses"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{isEdit ? "Edit warehouse" : "Warehouse"}</CardTitle>
          <RecordCode entity="Warehouse" code={warehouse.code} />
        </CardHeader>
        <CardContent>
          <WarehouseForm
            warehouse={warehouse}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
