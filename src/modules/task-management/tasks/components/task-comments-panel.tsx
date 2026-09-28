"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCreateTaskComment,
  useDeleteTaskComment,
} from "@/modules/task-management/tasks/mutations";
import { useTaskComments } from "@/modules/task-management/tasks/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDateTime } from "@/shared/lib/format";

export function TaskCommentsPanel({
  taskId,
  canCreate,
  canDelete,
}: {
  taskId: string;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const commentsQuery = useTaskComments(taskId);
  const createComment = useCreateTaskComment();
  const deleteComment = useDeleteTaskComment();
  const userNameById = useUserNameMap();
  const [body, setBody] = useState("");

  async function submitComment() {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await createComment.mutateAsync({ taskId, body: trimmed });
      setBody("");
      toast.success("Comment added");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const comments = commentsQuery.data ?? [];

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              {(comment.created_by && userNameById.get(comment.created_by)) || "User"} ·{" "}
              {formatDateTime(comment.created_at)}
            </p>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  void deleteComment
                    .mutateAsync({ taskId, commentId: comment.id })
                    .then(() => toast.success("Comment deleted"))
                }
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
        </div>
      ))}
      {canCreate ? (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a comment"
            rows={3}
          />
          <Button
            type="button"
            onClick={() => void submitComment()}
            disabled={createComment.isPending}
          >
            {createComment.isPending ? <Loader2 className="animate-spin" /> : "Add comment"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
