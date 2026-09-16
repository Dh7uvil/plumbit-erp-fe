import { CategoryDetailScreen } from "@/modules/inventory-management/categories/components/category-detail-screen";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={categoryPermissions.read}
      notFoundMessage="Category not found."
    >
      {(id) => <CategoryDetailScreen categoryId={id} mode="view" />}
    </DetailPageRoute>
  );
}
