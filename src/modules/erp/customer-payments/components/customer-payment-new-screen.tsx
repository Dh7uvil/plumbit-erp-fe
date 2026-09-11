"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { CustomerPaymentForm } from "@/modules/erp/customer-payments/components/customer-payment-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const UuidSchema = z.string().uuid();

function optionalUuid(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  return UuidSchema.safeParse(value).success ? value : undefined;
}

export function CustomerPaymentNewScreen() {
  const searchParams = useSearchParams();
  const defaults = {
    customerId: optionalUuid(searchParams.get("customer_id")),
    invoiceId: optionalUuid(searchParams.get("invoice_id")),
    proformaInvoiceId: optionalUuid(searchParams.get("proforma_invoice_id")),
    salesOrderId: optionalUuid(searchParams.get("sales_order_id")),
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New customer receipt"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/customer-payments">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPaymentForm payment={null} defaults={defaults} />
        </CardContent>
      </Card>
    </div>
  );
}
