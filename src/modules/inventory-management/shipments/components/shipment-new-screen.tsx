"use client";

import Link from "next/link";

import { ShipmentForm } from "@/modules/inventory-management/shipments/components/shipment-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ShipmentNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New shipment"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/shipments">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentForm shipment={null} />
        </CardContent>
      </Card>
    </div>
  );
}
