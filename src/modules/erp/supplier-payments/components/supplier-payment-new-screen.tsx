"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { SupplierPaymentForm } from "@/modules/erp/supplier-payments/components/supplier-payment-form";
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

export function SupplierPaymentNewScreen() {
  const searchParams = useSearchParams();
  const defaults = {
    supplierId: optionalUuid(searchParams.get("supplier_id")),
    invoiceId: optionalUuid(searchParams.get("invoice_id")),
    purchaseOrderId: optionalUuid(searchParams.get("purchase_order_id")),
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New supplier payment"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/supplier-payments">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supplier payment</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierPaymentForm payment={null} defaults={defaults} />
        </CardContent>
      </Card>
    </div>
  );
}
