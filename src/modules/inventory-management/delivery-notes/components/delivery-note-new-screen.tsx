"use client";

import Link from "next/link";

import { DeliveryNoteForm } from "@/modules/inventory-management/delivery-notes/components/delivery-note-form";
import { DeliveryNoteFromSalesOrderForm } from "@/modules/inventory-management/delivery-notes/components/delivery-note-from-sales-order-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function DeliveryNoteNewScreen({ salesOrderId }: { salesOrderId?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New delivery note"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/delivery-notes">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {salesOrderId ? "Deliver from sales order" : "Delivery note"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesOrderId ? (
            <DeliveryNoteFromSalesOrderForm salesOrderId={salesOrderId} />
          ) : (
            <DeliveryNoteForm note={null} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
