"use client";

import Link from "next/link";

import { ChequeForm } from "@/modules/erp/accounting/cheques/components/cheque-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ChequeNewScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New cheque"
        subtitle="Register an inbound or outbound cheque with optional invoice allocation."
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/cheques">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cheque details</CardTitle>
        </CardHeader>
        <CardContent>
          <ChequeForm />
        </CardContent>
      </Card>
    </div>
  );
}
