"use client";

import Link from "next/link";

import { PackageForm } from "@/modules/inventory-management/packages/components/package-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function PackageNewScreen({
  salesOrderId,
  deliveryNoteId,
}: {
  salesOrderId?: string;
  deliveryNoteId?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New package"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/packages">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Package</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageForm pkg={null} salesOrderId={salesOrderId} deliveryNoteId={deliveryNoteId} />
        </CardContent>
      </Card>
    </div>
  );
}
