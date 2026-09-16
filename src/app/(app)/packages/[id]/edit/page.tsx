import { PackageDetailScreen } from "@/modules/inventory-management/packages/components/package-detail-screen";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PackageEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={packagePermissions.update}
      notFoundMessage="Package not found."
    >
      {(id) => <PackageDetailScreen packageId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
