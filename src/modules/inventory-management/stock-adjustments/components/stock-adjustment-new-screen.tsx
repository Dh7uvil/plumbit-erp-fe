"use client";

import Link from "next/link";

import { StockAdjustmentForm } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function StockAdjustmentNewScreen({
  productId,
  warehouseId,
}: {
  productId?: string;
  warehouseId?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New stock adjustment"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/stock-adjustments">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <StockAdjustmentForm
            adjustment={null}
            defaultProductId={productId}
            defaultWarehouseId={warehouseId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
