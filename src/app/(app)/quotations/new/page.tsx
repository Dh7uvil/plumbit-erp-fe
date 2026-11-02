import { Suspense } from "react";

import { QuotationNewScreen } from "@/modules/erp/quotations/components/quotation-new-screen";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewQuotationPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={quotationPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewQuotationContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewQuotationContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = params.opportunity_id;
  const opportunityId = typeof raw === "string" ? raw : undefined;
  return <QuotationNewScreen opportunityId={opportunityId} />;
}
