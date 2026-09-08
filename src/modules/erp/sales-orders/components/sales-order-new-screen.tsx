"use client";

import Link from "next/link";

import { SalesOrderForm } from "@/modules/erp/sales-orders/components/sales-order-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function SalesOrderNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New sales order"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/sales-orders">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales order</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesOrderForm salesOrder={null} />
        </CardContent>
      </Card>
    </div>
  );
}
