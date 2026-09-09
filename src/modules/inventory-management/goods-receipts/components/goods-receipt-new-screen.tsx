"use client";

import Link from "next/link";

import { GoodsReceiptForm } from "@/modules/inventory-management/goods-receipts/components/goods-receipt-form";
import { GoodsReceiptFromPoForm } from "@/modules/inventory-management/goods-receipts/components/goods-receipt-from-po-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function GoodsReceiptNewScreen({ purchaseOrderId }: { purchaseOrderId?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New goods receipt"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/goods-receipts">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {purchaseOrderId ? "Receive from purchase order" : "Goods receipt"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrderId ? (
            <GoodsReceiptFromPoForm purchaseOrderId={purchaseOrderId} />
          ) : (
            <GoodsReceiptForm receipt={null} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
