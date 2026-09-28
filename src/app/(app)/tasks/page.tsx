import { TasksScreen } from "@/modules/task-management/tasks/components/tasks-screen";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function TasksPage() {
  return (
    <PermissionGate permission={taskPermissions.read}>
      <TasksScreen />
    </PermissionGate>
  );
}
