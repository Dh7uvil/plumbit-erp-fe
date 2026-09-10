import { z } from "zod";

import { SalesInvoiceDetailScreen } from "@/modules/erp/sales-invoices/components/sales-invoice-detail-screen";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function SalesInvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={salesInvoicePermissions.update}>
      {parsed.success ? (
        <SalesInvoiceDetailScreen invoiceId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Sales invoice not found.</p>
      )}
    </PermissionGate>
  );
}
