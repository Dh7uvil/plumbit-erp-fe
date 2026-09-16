import { QualityInspectionDetailScreen } from "@/modules/inventory-management/quality-inspections/components/quality-inspection-detail-screen";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function QualityInspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={qualityInspectionPermissions.read}
      notFoundMessage="Quality inspection not found."
    >
      {(id) => <QualityInspectionDetailScreen inspectionId={id} mode="view" />}
    </DetailPageRoute>
  );
}
