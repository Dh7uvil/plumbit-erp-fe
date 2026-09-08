"use client";

import Link from "next/link";

import { PurchaseOrderForm } from "@/modules/erp/purchase-orders/components/purchase-order-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function PurchaseOrderNewScreen() {
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
          <PurchaseOrderForm purchaseOrder={null} />
        </CardContent>
      </Card>
    </div>
  );
}
