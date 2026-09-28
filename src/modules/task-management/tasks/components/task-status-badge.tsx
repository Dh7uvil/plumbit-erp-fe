import {
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANTS,
  type TaskStatus,
} from "@/modules/task-management/tasks/schemas";
import { Badge } from "@/shared/components/ui/badge";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={TASK_STATUS_VARIANTS[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}
