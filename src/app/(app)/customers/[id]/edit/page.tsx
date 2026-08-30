import { z } from "zod";

import { CustomerDetailScreen } from "@/modules/crm/customers/components/customer-detail-screen";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const CustomerIdSchema = z.string().uuid();

export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = CustomerIdSchema.safeParse(id);

  return (
    <PermissionGate permission={customerPermissions.update}>
      {parsed.success ? (
        <CustomerDetailScreen customerId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Customer not found.</p>
      )}
    </PermissionGate>
  );
}
