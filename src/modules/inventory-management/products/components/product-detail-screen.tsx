"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProductSuppliersPanel } from "@/modules/erp/supplier-products/components/product-suppliers-panel";
import {
  ProductCustomersCard,
  ProductPurchaseHistoryCard,
  ProductSalesHistoryCard,
} from "@/modules/inventory-management/history/components/trading-history-cards";
import { ProductForm } from "@/modules/inventory-management/products/components/product-form";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useProduct } from "@/modules/inventory-management/products/queries";
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
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { historyHref } from "@/shared/lib/history";

export function ProductDetailScreen({
  productId,
  mode,
}: {
  productId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(productPermissions);
  const productQuery = useProduct(productId);
  const product = productQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/products/${productId}`;

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
      <RecordPageHeader
        title={product.name}
        code={product.sku}
        codeTooltip="SKU"
        listHref="/products"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{isEdit ? "Edit product" : "Product"}</CardTitle>
          {mode === "view" ? (
            <HistoryHeaderButton href={historyHref("products", product.id, product.sku)} />
          ) : null}
        </CardHeader>
        <CardContent>
          <ProductForm
            product={product}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {isEdit ? null : (
        <>
          <ProductSuppliersPanel productId={product.id} />
          <ProductCustomersCard productId={product.id} />
          <ProductSalesHistoryCard productId={product.id} />
          <ProductPurchaseHistoryCard productId={product.id} />
          <EntityAttachmentsPanel entityType="PRODUCT" entityId={product.id} />
        </>
      )}
    </div>
  );
}
