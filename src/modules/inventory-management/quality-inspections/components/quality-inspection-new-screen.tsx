"use client";

import Link from "next/link";

import { QualityInspectionForm } from "@/modules/inventory-management/quality-inspections/components/quality-inspection-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function QualityInspectionNewScreen({ goodsReceiptId }: { goodsReceiptId?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New quality inspection"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/quality-inspections">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <QualityInspectionForm inspection={null} defaultGoodsReceiptId={goodsReceiptId} />
        </CardContent>
      </Card>
    </div>
  );
}
