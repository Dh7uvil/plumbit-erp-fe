import { CategoryDetailScreen } from "@/modules/inventory-management/categories/components/category-detail-screen";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CategoryDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={categoryPermissions.update}
      notFoundMessage="Category not found."
    >
      {(id) => <CategoryDetailScreen categoryId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
