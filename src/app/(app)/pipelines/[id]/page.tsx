import { PipelineDetailScreen } from "@/modules/crm/pipelines/components/pipeline-detail-screen";
import { pipelinePermissions } from "@/modules/crm/pipelines/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PipelineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={pipelinePermissions.read}
      notFoundMessage="Pipeline not found."
    >
      {(id) => <PipelineDetailScreen pipelineId={id} mode="view" />}
    </DetailPageRoute>
  );
}
