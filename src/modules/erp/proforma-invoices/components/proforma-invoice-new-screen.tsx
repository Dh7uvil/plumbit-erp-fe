"use client";

import Link from "next/link";

import { ProformaInvoiceForm } from "@/modules/erp/proforma-invoices/components/proforma-invoice-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ProformaInvoiceNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New proforma invoice"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/proforma-invoices">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proforma invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <ProformaInvoiceForm invoice={null} />
        </CardContent>
      </Card>
    </div>
  );
}
