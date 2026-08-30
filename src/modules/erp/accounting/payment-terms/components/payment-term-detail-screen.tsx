"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PaymentTermForm } from "@/modules/erp/accounting/payment-terms/components/payment-term-form";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { usePaymentTerm } from "@/modules/erp/accounting/payment-terms/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function PaymentTermDetailScreen({
  termId,
  mode,
}: {
  termId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(paymentTermPermissions);
  const termQuery = usePaymentTerm(termId);
  const term = termQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/payment-terms/${termId}`;

  if (termQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (termQuery.isError || !term) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={termQuery.error ? getErrorMessage(termQuery.error) : "Payment term not found"}
          onRetry={() => termQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/payment-terms">Back to payment terms</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={term.name}
        listHref="/payment-terms"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit payment term" : "Payment term"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentTermForm
            term={term}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
