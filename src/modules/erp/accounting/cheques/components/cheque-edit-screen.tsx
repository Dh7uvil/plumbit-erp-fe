"use client";

import Link from "next/link";

import { ChequeForm } from "@/modules/erp/accounting/cheques/components/cheque-form";
import { useCheque } from "@/modules/erp/accounting/cheques/queries";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ChequeEditScreen({ id }: { id: string }) {
  const query = useCheque(id);
  const cheque = query.data;

  if (query.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!cheque || cheque.status !== "DRAFT") {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`Edit cheque ${cheque.cheque_number}`}
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/cheques/${cheque.id}`}>Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cheque details</CardTitle>
        </CardHeader>
        <CardContent>
          <ChequeForm cheque={cheque} />
        </CardContent>
      </Card>
    </div>
  );
}
