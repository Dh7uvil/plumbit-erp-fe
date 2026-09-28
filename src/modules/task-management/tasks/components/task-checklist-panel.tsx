"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from "@/modules/task-management/tasks/mutations";
import type { Task } from "@/modules/task-management/tasks/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";

export function TaskChecklistPanel({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const [title, setTitle] = useState("");

  async function addItem() {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await createItem.mutateAsync({
        taskId: task.id,
        values: { title: trimmed, sort_order: task.checklist_items.length },
      });
      setTitle("");
      toast.success("Checklist item added");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-3">
      {task.checklist_items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.is_done}
            disabled={!canEdit || updateItem.isPending}
            onCheckedChange={(checked) => {
              void updateItem.mutateAsync({
                taskId: task.id,
                itemId: item.id,
                values: { is_done: checked === true },
              });
            }}
          />
          <span className={item.is_done ? "text-muted-foreground line-through" : ""}>
            {item.title}
          </span>
          {canEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                void deleteItem
                  .mutateAsync({ taskId: task.id, itemId: item.id })
                  .then(() => toast.success("Checklist item removed"))
              }
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      ))}
      {canEdit ? (
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add checklist item"
          />
          <Button type="button" onClick={() => void addItem()} disabled={createItem.isPending}>
            {createItem.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
