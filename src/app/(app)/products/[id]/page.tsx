import { z } from "zod";

import { ProductDetailScreen } from "@/modules/inventory-management/products/components/product-detail-screen";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const ProductIdSchema = z.string().uuid();

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = ProductIdSchema.safeParse(id);

  return (
    <PermissionGate permission={productPermissions.read}>
      {parsed.success ? (
        <ProductDetailScreen productId={parsed.data} />
      ) : (
        <p className="text-muted-foreground text-sm">Product not found.</p>
      )}
    </PermissionGate>
  );
}
