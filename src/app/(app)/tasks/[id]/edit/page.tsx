import { TaskDetailScreen } from "@/modules/task-management/tasks/components/task-detail-screen";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function TaskEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={taskPermissions.update}>
      <TaskDetailScreen taskId={id} mode="edit" />
    </PermissionGate>
  );
}
