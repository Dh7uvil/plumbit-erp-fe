import { z } from "zod";

import { SupplierProductDetailScreen } from "@/modules/erp/supplier-products/components/supplier-product-detail-screen";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function SupplierProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={supplierProductPermissions.read}>
      {parsed.success ? (
        <SupplierProductDetailScreen catalogId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Catalog item not found.</p>
      )}
    </PermissionGate>
  );
}
