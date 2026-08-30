import { z } from "zod";

import { CustomerDetailScreen } from "@/modules/crm/customers/components/customer-detail-screen";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const CustomerIdSchema = z.string().uuid();

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = CustomerIdSchema.safeParse(id);

  return (
    <PermissionGate permission={customerPermissions.read}>
      {parsed.success ? (
        <CustomerDetailScreen customerId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Customer not found.</p>
      )}
    </PermissionGate>
  );
}
