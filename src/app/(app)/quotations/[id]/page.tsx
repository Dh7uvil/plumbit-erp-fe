import { z } from "zod";

import { QuotationDetailScreen } from "@/modules/erp/quotations/components/quotation-detail-screen";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const QuotationIdSchema = z.string().uuid();

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = QuotationIdSchema.safeParse(id);

  return (
    <PermissionGate permission={quotationPermissions.read}>
      {parsed.success ? (
        <QuotationDetailScreen quotationId={parsed.data} />
      ) : (
        <p className="text-muted-foreground text-sm">Quotation not found.</p>
      )}
    </PermissionGate>
  );
}
