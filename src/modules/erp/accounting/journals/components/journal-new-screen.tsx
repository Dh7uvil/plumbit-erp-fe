"use client";

import Link from "next/link";

import { JournalForm } from "@/modules/erp/accounting/journals/components/journal-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function JournalNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New journal"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/journals">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <JournalForm journal={null} />
        </CardContent>
      </Card>
    </div>
  );
}
