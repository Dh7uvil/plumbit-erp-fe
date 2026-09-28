"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TaskParentSelect } from "@/modules/task-management/tasks/components/task-parent-select";
import { TaskRelatedEntitySelect } from "@/modules/task-management/tasks/components/task-related-entity-select";
import {
  useCreateTask,
  useMoveTask,
  useUpdateTask,
} from "@/modules/task-management/tasks/mutations";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_TYPES,
  TASK_TYPE_LABELS,
  TASK_RELATED_ENTITY_LABELS,
  TASK_RELATED_ENTITY_TYPES,
  TaskFormSchema,
  fromDatetimeLocal,
  toDatetimeLocal,
  type Task,
  type TaskFormValues,
  type TaskRelatedEntityType,
  type TaskStatus,
} from "@/modules/task-management/tasks/schemas";
import { useAllTaskLabels } from "@/modules/task-management/task-labels/queries";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { SearchableSelect } from "@/shared/components/form/searchable-select";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

const NONE = "__none__";

function toFormValues(task: Task | null, initial?: Partial<TaskFormValues>): TaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    task_type: task?.task_type ?? "TASK",
    priority: task?.priority ?? "MEDIUM",
    due_at: toDatetimeLocal(task?.due_at),
    assignee_id: task?.assignee_id ?? NONE,
    parent_id: task?.parent_id ?? NONE,
    related_entity_type: task?.related_entity_type ?? NONE,
    related_entity_id: task?.related_entity_id ?? "",
    label_ids: task?.labels.map((label) => label.id) ?? [],
    watcher_ids: task?.watcher_ids ?? [],
    ...initial,
  };
}

export function TaskForm({
  task,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
  initialValues,
  initialStatus,
  relatedLocked = false,
}: {
  task?: Task | null;
  disabled?: boolean;
  onSuccess?: (entity: Task) => void;
  showCancel?: boolean;
  onCancel?: () => void;
  initialValues?: Partial<TaskFormValues>;
  initialStatus?: TaskStatus;
  relatedLocked?: boolean;
}) {
  const createTask = useCreateTask();
  const moveTask = useMoveTask();
  const updateTask = useUpdateTask();
  const usersQuery = useAllUsers();
  const labelsQuery = useAllTaskLabels();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    ...(task
      ? { values: toFormValues(task, initialValues) }
      : { defaultValues: toFormValues(null, initialValues) }),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);
  const relatedEntityType = form.watch("related_entity_type");
  const taskType = form.watch("task_type");

  const userOptions = (usersQuery.data ?? []).map((user) => ({
    value: user.id,
    label: user.name || user.email,
  }));
  const labelOptions = (labelsQuery.data ?? []).map((label) => ({
    value: label.id,
    label: label.name,
  }));

  async function onSubmit(values: TaskFormValues) {
    setFormError(null);
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      task_type: values.task_type,
      priority: values.priority,
      due_at: fromDatetimeLocal(values.due_at),
      assignee_id: values.assignee_id === NONE ? null : values.assignee_id,
      parent_id: values.parent_id === NONE ? null : values.parent_id,
      related_entity_type:
        values.related_entity_type === NONE
          ? null
          : (values.related_entity_type as TaskRelatedEntityType),
      related_entity_id:
        values.related_entity_type === NONE || !values.related_entity_id
          ? null
          : values.related_entity_id,
      label_ids: values.label_ids,
      watcher_ids: values.watcher_ids,
    };
    try {
      if (task) {
        const updated = await updateTask.mutateAsync({
          id: task.id,
          values: {
            title: payload.title,
            description: payload.description,
            task_type: payload.task_type,
            priority: payload.priority,
            due_at: payload.due_at,
            assignee_id: payload.assignee_id,
            parent_id: payload.parent_id,
            related_entity_type: payload.related_entity_type,
            related_entity_id: payload.related_entity_id,
          },
        });
        toast.success("Task updated");
        onSuccess?.(updated);
      } else {
        const created = await createTask.mutateAsync(payload);
        let result = created;
        if (initialStatus && initialStatus !== "TODO") {
          result = await moveTask.mutateAsync({
            id: created.id,
            values: { status: initialStatus, sort_order: created.sort_order },
          });
        }
        toast.success("Task created");
        onSuccess?.(result);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) return;
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createTask.isPending || updateTask.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={disabled} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="task_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TASK_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {TASK_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TASK_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {TASK_PRIORITY_LABELS[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[{ value: NONE, label: "Unassigned" }, ...userOptions]}
                  disabled={disabled}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Parent task</FormLabel>
                <TaskParentSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  excludeTaskId={task?.id}
                  taskType={taskType}
                  disabled={disabled}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {relatedLocked ? null : (
            <FormField
              control={form.control}
              name="related_entity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related record type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("related_entity_id", "", { shouldDirty: true });
                    }}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {TASK_RELATED_ENTITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {TASK_RELATED_ENTITY_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {relatedLocked ? null : (
            <FormField
              control={form.control}
              name="related_entity_id"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Related record</FormLabel>
                  <FormControl>
                    <TaskRelatedEntitySelect
                      entityType={
                        relatedEntityType === NONE
                          ? null
                          : (relatedEntityType as TaskRelatedEntityType)
                      }
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled || relatedEntityType === NONE}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        {!task ? (
          <>
            <FormField
              control={form.control}
              name="label_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labels</FormLabel>
                  <MultiSelect
                    options={labelOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="watcher_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Watchers</FormLabel>
                  <MultiSelect
                    options={userOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled}
                  />
                </FormItem>
              )}
            />
          </>
        ) : null}
        <div className="flex justify-end gap-2">
          {showCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={disabled || pending}>
            {pending ? <Loader2 className="animate-spin" /> : task ? "Save task" : "Create task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
