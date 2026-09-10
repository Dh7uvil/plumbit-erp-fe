"use client";

import Link from "next/link";

import { SalesReturnForm } from "@/modules/inventory-management/sales-returns/components/sales-return-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function SalesReturnNewScreen({ deliveryNoteId }: { deliveryNoteId?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New sales return"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/sales-returns">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales return</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesReturnForm doc={null} defaultDeliveryNoteId={deliveryNoteId} />
        </CardContent>
      </Card>
    </div>
  );
}
