import { z } from "zod";

import { SupplierPaymentDetailScreen } from "@/modules/erp/supplier-payments/components/supplier-payment-detail-screen";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function SupplierPaymentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={supplierPaymentPermissions.update}>
      {parsed.success ? (
        <SupplierPaymentDetailScreen paymentId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Payment not found.</p>
      )}
    </PermissionGate>
  );
}
