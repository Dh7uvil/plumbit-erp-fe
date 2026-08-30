import { z } from "zod";

import { PaymentTermDetailScreen } from "@/modules/erp/accounting/payment-terms/components/payment-term-detail-screen";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function PaymentTermDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={paymentTermPermissions.update}>
      {parsed.success ? (
        <PaymentTermDetailScreen termId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Payment term not found.</p>
      )}
    </PermissionGate>
  );
}
