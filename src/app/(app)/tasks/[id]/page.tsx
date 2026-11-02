import { TaskDetailScreen } from "@/modules/task-management/tasks/components/task-detail-screen";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={taskPermissions.read}
      notFoundMessage="Task not found."
    >
      {(id) => <TaskDetailScreen taskId={id} mode="view" />}
    </DetailPageRoute>
  );
}
