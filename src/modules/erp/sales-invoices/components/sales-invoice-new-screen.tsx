"use client";

import Link from "next/link";

import { SalesInvoiceForm } from "@/modules/erp/sales-invoices/components/sales-invoice-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function SalesInvoiceNewScreen({ exportPreset = false }: { exportPreset?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={exportPreset ? "New export invoice" : "New sales invoice"}
        subtitle={
          exportPreset
            ? "Export preset: EXP numbering, export VAT treatment, FCY totals with base (LCY) equivalent."
            : undefined
        }
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/sales-invoices">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {exportPreset ? "Export invoice" : "Sales invoice"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesInvoiceForm invoice={null} exportPreset={exportPreset} />
        </CardContent>
      </Card>
    </div>
  );
}
