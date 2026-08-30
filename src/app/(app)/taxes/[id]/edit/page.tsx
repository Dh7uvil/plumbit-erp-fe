import { z } from "zod";

import { TaxDetailScreen } from "@/modules/erp/accounting/taxes/components/tax-detail-screen";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function TaxDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={taxPermissions.update}>
      {parsed.success ? (
        <TaxDetailScreen taxId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Tax not found.</p>
      )}
    </PermissionGate>
  );
}
