import { z } from "zod";

import { SupplierPaymentDetailScreen } from "@/modules/erp/supplier-payments/components/supplier-payment-detail-screen";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function SupplierPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={supplierPaymentPermissions.read}>
      {parsed.success ? (
        <SupplierPaymentDetailScreen paymentId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Payment not found.</p>
      )}
    </PermissionGate>
  );
}
