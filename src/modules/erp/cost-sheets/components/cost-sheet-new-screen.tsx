"use client";

import Link from "next/link";

import { CostSheetForm } from "@/modules/erp/cost-sheets/components/cost-sheet-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function CostSheetNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New cost sheet"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/cost-sheets">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <CostSheetForm sheet={null} />
        </CardContent>
      </Card>
    </div>
  );
}
