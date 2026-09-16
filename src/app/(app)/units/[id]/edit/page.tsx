import { UnitDetailScreen } from "@/modules/inventory-management/units/components/unit-detail-screen";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function UnitDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={unitPermissions.update}
      notFoundMessage="Unit not found."
    >
      {(id) => <UnitDetailScreen unitId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
