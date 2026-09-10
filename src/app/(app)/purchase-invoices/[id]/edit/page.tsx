import { z } from "zod";

import { PurchaseInvoiceDetailScreen } from "@/modules/erp/purchase-invoices/components/purchase-invoice-detail-screen";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function PurchaseInvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={purchaseInvoicePermissions.update}>
      {parsed.success ? (
        <PurchaseInvoiceDetailScreen invoiceId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Purchase invoice not found.</p>
      )}
    </PermissionGate>
  );
}
