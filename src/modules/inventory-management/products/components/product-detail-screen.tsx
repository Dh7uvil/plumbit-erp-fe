"use client";

import Link from "next/link";

import { ProductForm } from "@/modules/inventory-management/products/components/product-form";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useProduct } from "@/modules/inventory-management/products/queries";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useCan } from "@/shared/providers/session-provider";

export function ProductDetailScreen({ productId }: { productId: string }) {
  const can = useCan();
  const canUpdate = can(productPermissions.update);
  const productQuery = useProduct(productId);
  const product = productQuery.data;

  if (productQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={productQuery.error ? getErrorMessage(productQuery.error) : "Product not found"}
          onRetry={() => productQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={product.name}
        subtitle={product.sku}
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/products">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{canUpdate ? "Edit product" : "Product"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} disabled={!canUpdate} />
        </CardContent>
      </Card>
      <EntityAttachmentsPanel entityType="PRODUCT" entityId={product.id} />
    </div>
  );
}
