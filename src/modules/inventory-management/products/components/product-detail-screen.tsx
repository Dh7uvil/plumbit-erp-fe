"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProductSuppliersPanel } from "@/modules/erp/supplier-products/components/product-suppliers-panel";
import {
  ProductCustomersCard,
  ProductPurchaseHistoryCard,
  ProductSalesHistoryCard,
} from "@/modules/inventory-management/history/components/trading-history-cards";
import { ProductForm } from "@/modules/inventory-management/products/components/product-form";
import { ProductInquiryPanel } from "@/modules/inventory-management/products/components/product-inquiry-panel";
import { ProductRenameSkuDialog } from "@/modules/inventory-management/products/components/product-rename-sku-dialog";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useProduct } from "@/modules/inventory-management/products/queries";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { useCan } from "@/shared/providers/session-provider";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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
  const can = useCan();
  const { canUpdate } = useCrudPermissions(productPermissions);
  const canReadStock = can(stockPermissions.read);
  const productQuery = useProduct(productId);
  const product = productQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/products/${productId}`;
  const [renameOpen, setRenameOpen] = useState(false);

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
        extraActions={
          mode === "view" ? (
            <div className="flex flex-wrap items-center gap-2">
              {canUpdate ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setRenameOpen(true)}>
                  Rename item code
                </Button>
              ) : null}
              {canReadStock ? (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={`/stock/${productId}`}>View stock</Link>
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />
      <ProductRenameSkuDialog product={product} open={renameOpen} onOpenChange={setRenameOpen} />
      {isEdit ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Edit product</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              product={product}
              disabled={false}
              onSuccess={() => router.push(viewHref)}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="master" className="flex flex-col gap-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="master">Master</TabsTrigger>
            {canReadStock ? <TabsTrigger value="inventory">Inventory</TabsTrigger> : null}
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <TabsContent value="master">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">Product</CardTitle>
                <HistoryHeaderButton href={historyHref("products", product.id, product.sku)} />
              </CardHeader>
              <CardContent>
                <ProductForm product={product} disabled onSuccess={() => router.push(viewHref)} />
              </CardContent>
            </Card>
          </TabsContent>
          {canReadStock ? (
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inventory details</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductInquiryPanel product={product} showStockLink extended />
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}
          <TabsContent value="trading" className="flex flex-col gap-5">
            <ProductCustomersCard productId={product.id} />
            <ProductSuppliersPanel productId={product.id} />
            <ProductSalesHistoryCard productId={product.id} />
            <ProductPurchaseHistoryCard productId={product.id} />
          </TabsContent>
          <TabsContent value="files">
            <EntityAttachmentsPanel entityType="PRODUCT" entityId={product.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
