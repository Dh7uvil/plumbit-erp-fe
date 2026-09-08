"use client";

import Link from "next/link";

import { StockTransferForm } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function StockTransferNewScreen({
  productId,
  warehouseId,
}: {
  productId?: string;
  warehouseId?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New stock transfer"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/stock-transfers">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTransferForm
            transfer={null}
            defaultProductId={productId}
            defaultWarehouseId={warehouseId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
