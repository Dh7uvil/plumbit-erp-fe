import { z } from "zod";

import { CustomerPaymentDetailScreen } from "@/modules/erp/customer-payments/components/customer-payment-detail-screen";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function CustomerPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={customerPaymentPermissions.read}>
      {parsed.success ? (
        <CustomerPaymentDetailScreen paymentId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Receipt not found.</p>
      )}
    </PermissionGate>
  );
}
