"use client";

import Link from "next/link";

import { PurchaseInvoiceForm } from "@/modules/erp/purchase-invoices/components/purchase-invoice-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function PurchaseInvoiceNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New purchase invoice"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/purchase-invoices">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseInvoiceForm invoice={null} />
        </CardContent>
      </Card>
    </div>
  );
}
