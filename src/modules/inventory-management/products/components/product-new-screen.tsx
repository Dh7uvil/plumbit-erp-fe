"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProductForm } from "@/modules/inventory-management/products/components/product-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ProductNewScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New product"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/products">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={null}
            showCancel
            onCancel={() => router.push("/products")}
            onSuccess={(product) => router.replace(`/products/${product.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
