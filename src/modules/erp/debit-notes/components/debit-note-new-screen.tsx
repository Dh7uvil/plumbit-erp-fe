"use client";

import Link from "next/link";

import { DebitNoteForm } from "@/modules/erp/debit-notes/components/debit-note-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function DebitNoteNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New debit note"
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/debit-notes">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debit note</CardTitle>
        </CardHeader>
        <CardContent>
          <DebitNoteForm note={null} />
        </CardContent>
      </Card>
    </div>
  );
}
