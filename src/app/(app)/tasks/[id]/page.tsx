import { TaskDetailScreen } from "@/modules/task-management/tasks/components/task-detail-screen";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={taskPermissions.read}>
      <TaskDetailScreen taskId={id} mode="view" />
    </PermissionGate>
  );
}
