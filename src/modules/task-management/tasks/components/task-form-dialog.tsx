"use client";

import { TaskForm } from "@/modules/task-management/tasks/components/task-form";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import type { Task, TaskFormValues, TaskStatus } from "@/modules/task-management/tasks/schemas";
import { TASK_STATUS_LABELS } from "@/modules/task-management/tasks/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  disabled = false,
  initialValues,
  initialStatus,
  relatedLocked = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  disabled?: boolean;
  initialValues?: Partial<TaskFormValues>;
  initialStatus?: TaskStatus;
  relatedLocked?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(taskPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: Boolean(task),
    canCreate,
    canUpdate,
    forceReadOnly: disabled,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {formDialogTitle("Task", mode)}
            {initialStatus && mode === "create" ? (
              <span className="text-muted-foreground block text-sm font-normal">
                Status: {TASK_STATUS_LABELS[initialStatus]}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>
        <TaskForm
          task={task}
          disabled={readOnly}
          initialValues={initialValues}
          initialStatus={initialStatus}
          relatedLocked={relatedLocked}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
