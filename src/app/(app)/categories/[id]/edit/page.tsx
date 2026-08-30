import { z } from "zod";

import { CategoryDetailScreen } from "@/modules/inventory-management/categories/components/category-detail-screen";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function CategoryDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={categoryPermissions.update}>
      {parsed.success ? (
        <CategoryDetailScreen categoryId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Category not found.</p>
      )}
    </PermissionGate>
  );
}
