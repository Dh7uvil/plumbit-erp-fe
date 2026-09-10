"use client";

import Link from "next/link";

import { SalesInvoiceForm } from "@/modules/erp/sales-invoices/components/sales-invoice-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function SalesInvoiceNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New sales invoice"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/sales-invoices">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesInvoiceForm invoice={null} />
        </CardContent>
      </Card>
    </div>
  );
}
