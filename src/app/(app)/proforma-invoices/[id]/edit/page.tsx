import { z } from "zod";

import { ProformaInvoiceDetailScreen } from "@/modules/erp/proforma-invoices/components/proforma-invoice-detail-screen";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const ProformaInvoiceIdSchema = z.string().uuid();

export default async function ProformaInvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = ProformaInvoiceIdSchema.safeParse(id);

  return (
    <PermissionGate permission={proformaInvoicePermissions.update}>
      {parsed.success ? (
        <ProformaInvoiceDetailScreen proformaInvoiceId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Proforma invoice not found.</p>
      )}
    </PermissionGate>
  );
}
