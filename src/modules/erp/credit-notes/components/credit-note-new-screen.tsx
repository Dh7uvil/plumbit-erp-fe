"use client";

import Link from "next/link";

import { CreditNoteForm } from "@/modules/erp/credit-notes/components/credit-note-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function CreditNoteNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New credit note"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/credit-notes">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credit note</CardTitle>
        </CardHeader>
        <CardContent>
          <CreditNoteForm note={null} />
        </CardContent>
      </Card>
    </div>
  );
}
