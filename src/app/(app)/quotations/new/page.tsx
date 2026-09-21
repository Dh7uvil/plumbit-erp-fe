import { QuotationNewScreen } from "@/modules/erp/quotations/components/quotation-new-screen";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.opportunity_id;
  const opportunityId = typeof raw === "string" ? raw : undefined;

  return (
    <PermissionGate permission={quotationPermissions.create}>
      <QuotationNewScreen opportunityId={opportunityId} />
    </PermissionGate>
  );
}
