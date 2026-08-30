import { z } from "zod";

import { SupplierDetailScreen } from "@/modules/erp/suppliers/components/supplier-detail-screen";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const SupplierIdSchema = z.string().uuid();

export default async function SupplierEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = SupplierIdSchema.safeParse(id);

  return (
    <PermissionGate permission={supplierPermissions.update}>
      {parsed.success ? (
        <SupplierDetailScreen supplierId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Supplier not found.</p>
      )}
    </PermissionGate>
  );
}
