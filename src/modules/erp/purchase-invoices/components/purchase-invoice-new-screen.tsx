"use client";

import Link from "next/link";

import { PurchaseInvoiceForm } from "@/modules/erp/purchase-invoices/components/purchase-invoice-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function PurchaseInvoiceNewScreen({ importPreset = false }: { importPreset?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={importPreset ? "New import purchase" : "New purchase invoice"}
        subtitle={
          importPreset
            ? "Import preset: LC numbering, IMPORT bill type, and import document fields."
            : undefined
        }
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/purchase-invoices">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {importPreset ? "Import purchase invoice" : "Purchase invoice"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseInvoiceForm invoice={null} importPreset={importPreset} />
        </CardContent>
      </Card>
    </div>
  );
}
