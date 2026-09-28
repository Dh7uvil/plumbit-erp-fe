import { TaskLabelsScreen } from "@/modules/task-management/task-labels/components/task-labels-screen";
import { taskLabelPermissions } from "@/modules/task-management/task-labels/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function TaskLabelsPage() {
  return (
    <PermissionGate permission={taskLabelPermissions.read}>
      <TaskLabelsScreen />
    </PermissionGate>
  );
}
