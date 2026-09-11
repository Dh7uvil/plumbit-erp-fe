"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { PurchaseOrderForm } from "@/modules/erp/purchase-orders/components/purchase-order-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const UuidSchema = z.string().uuid();

function optionalUuid(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  return UuidSchema.safeParse(value).success ? value : undefined;
}

export function PurchaseOrderNewScreen() {
  const searchParams = useSearchParams();
  const suggestionCompose = {
    supplierId: optionalUuid(searchParams.get("supplier_id")),
    warehouseId: optionalUuid(searchParams.get("warehouse_id")),
    productId: optionalUuid(searchParams.get("product_id")),
    quantity: searchParams.get("quantity")?.trim() || undefined,
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New purchase order"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/purchase-orders">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase order</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            purchaseOrder={null}
            suggestionCompose={
              suggestionCompose.supplierId ||
              suggestionCompose.warehouseId ||
              suggestionCompose.productId
                ? suggestionCompose
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
