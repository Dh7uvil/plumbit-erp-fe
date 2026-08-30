"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CurrencyForm } from "@/modules/erp/currencies/components/currency-form";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useCurrency } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { RecordCode } from "@/shared/components/form/record-code";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function CurrencyDetailScreen({
  currencyId,
  mode,
}: {
  currencyId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(currencyPermissions);
  const currencyQuery = useCurrency(currencyId);
  const currency = currencyQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/currencies/${currencyId}`;

  if (currencyQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (currencyQuery.isError || !currency) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            currencyQuery.error ? getErrorMessage(currencyQuery.error) : "Currency not found"
          }
          onRetry={() => currencyQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/currencies">Back to currencies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={currency.name}
        code={currency.code}
        listHref="/currencies"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{isEdit ? "Edit currency" : "Currency"}</CardTitle>
          <RecordCode entity="Currency" code={currency.code} />
        </CardHeader>
        <CardContent>
          <CurrencyForm
            currency={currency}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
