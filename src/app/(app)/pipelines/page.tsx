import { PipelinesScreen } from "@/modules/crm/pipelines/components/pipelines-screen";
import { pipelinePermissions } from "@/modules/crm/pipelines/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function PipelinesPage() {
  return (
    <PermissionGate permission={pipelinePermissions.read}>
      <PipelinesScreen />
    </PermissionGate>
  );
}
