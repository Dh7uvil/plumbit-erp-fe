"use client";

import Link from "next/link";

import { QuotationForm } from "@/modules/erp/quotations/components/quotation-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function QuotationNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New quotation"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/quotations">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quotation</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationForm quotation={null} />
        </CardContent>
      </Card>
    </div>
  );
}
