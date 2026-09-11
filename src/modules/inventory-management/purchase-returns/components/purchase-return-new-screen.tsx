"use client";

import Link from "next/link";

import { PurchaseReturnForm } from "@/modules/inventory-management/purchase-returns/components/purchase-return-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function PurchaseReturnNewScreen({ goodsReceiptId }: { goodsReceiptId?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New purchase return"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/purchase-returns">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase return</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseReturnForm doc={null} defaultGoodsReceiptId={goodsReceiptId} />
        </CardContent>
      </Card>
    </div>
  );
}
