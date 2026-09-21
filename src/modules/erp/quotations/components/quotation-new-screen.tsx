"use client";

import Link from "next/link";

import { useOpportunity } from "@/modules/crm/opportunities/queries";
import { QuotationForm } from "@/modules/erp/quotations/components/quotation-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function QuotationNewScreen({ opportunityId }: { opportunityId?: string }) {
  const opportunityQuery = useOpportunity(opportunityId ?? null);
  const opportunity = opportunityQuery.data;
  const opportunityLabel = opportunity
    ? `${opportunity.name} (${opportunity.opportunity_number})`
    : undefined;

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
          {opportunityId && opportunityQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <QuotationForm
              quotation={null}
              opportunityId={opportunityId}
              opportunityLabel={opportunityLabel}
              defaultCustomerId={opportunity?.customer_id ?? undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
