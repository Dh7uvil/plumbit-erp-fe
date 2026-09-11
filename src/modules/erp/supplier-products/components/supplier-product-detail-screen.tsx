"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupplierProductForm } from "@/modules/erp/supplier-products/components/supplier-product-form";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { useSupplierProduct } from "@/modules/erp/supplier-products/queries";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
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

export function SupplierProductDetailScreen({
  catalogId,
  mode,
}: {
  catalogId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(supplierProductPermissions);
  const catalogQuery = useSupplierProduct(catalogId);
  const row = catalogQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/supplier-products/${catalogId}`;

  if (catalogQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (catalogQuery.isError || !row) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={catalogQuery.error ? getErrorMessage(catalogQuery.error) : "Catalog item not found"}
          onRetry={() => catalogQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/supplier-products">Back to catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={row.supplier_item_name || row.supplier_sku}
        code={row.supplier_sku}
        listHref="/supplier-products"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit catalog item" : "Catalog item"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierProductForm
            supplierProduct={row}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {row.product_id ? (
        <EntityAttachmentsPanel entityType="PRODUCT" entityId={row.product_id} />
      ) : null}
      <ActivityFeed entityType="supplier_product" entityId={row.id} />
    </div>
  );
}
