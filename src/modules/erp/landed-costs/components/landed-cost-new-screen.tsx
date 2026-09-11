"use client";

import Link from "next/link";
import { useState } from "react";

import { ComposeFromBillsDialog } from "@/modules/erp/landed-costs/components/compose-from-bills-dialog";
import { LandedCostForm } from "@/modules/erp/landed-costs/components/landed-cost-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function LandedCostNewScreen({
  goodsReceiptId,
  purchaseInvoiceId,
  shipmentId,
}: {
  goodsReceiptId?: string;
  purchaseInvoiceId?: string;
  shipmentId?: string;
}) {
  const [composeOpen, setComposeOpen] = useState(Boolean(purchaseInvoiceId));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New landed cost"
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setComposeOpen(true)}>
              From bills
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/landed-costs">Back</Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Landed cost</CardTitle>
        </CardHeader>
        <CardContent>
          <LandedCostForm document={null} defaultGoodsReceiptId={goodsReceiptId} />
        </CardContent>
      </Card>
      <ComposeFromBillsDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        purchaseInvoiceId={purchaseInvoiceId}
        goodsReceiptId={goodsReceiptId}
        shipmentId={shipmentId}
      />
    </div>
  );
}
