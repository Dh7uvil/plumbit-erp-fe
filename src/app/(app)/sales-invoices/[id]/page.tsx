import { z } from "zod";

import { SalesInvoiceDetailScreen } from "@/modules/erp/sales-invoices/components/sales-invoice-detail-screen";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function SalesInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={salesInvoicePermissions.read}>
      {parsed.success ? (
        <SalesInvoiceDetailScreen invoiceId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Sales invoice not found.</p>
      )}
    </PermissionGate>
  );
}
